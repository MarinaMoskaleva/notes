const express = require("express");
const showdown  = require('showdown');
const fs = require('fs');
const path = require('path');

const bodyParser = require("body-parser");

const { MongoClient } = require("mongodb");

const passport = require('passport');

const VKontakteStrategy = require('passport-vkontakte').Strategy;

passport.use(new VKontakteStrategy({
    clientID:     '51406037',
    clientSecret: 'dVUauwh2KgECFORlpmFr',
    callbackURL:  "http://localhost:3000/auth/vkontakte/callback"
  },
  function(accessToken, refreshToken, params, profile, done) {
    return done(null, profile);
  }
));

const {
  findUserByUsername,
  createUser,
  createToken,
  deleteToken,
  createNote,
  findNotesByUserId,
  findNoteById,
  updateNoteById,
  deleteNoteById,
  updateArchiveStateNodeById,
  deleteAllArchived,
  hash,
} = require("./db");

const { auth } = require("./auth");

const clientPromise = MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

const createDemoNote = (db, userId) => {
  const filePath = path.join(__dirname, 'demo.txt')
  fs.readFile(filePath, {encoding: 'utf-8'}, async (err,data) => {
    if (!err) {
      await createNote(db, userId, 'Demo', data);
    } else {
      console.log(err);
    }
  });
}

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    const client = await clientPromise;
    req.db = client.db("users");
    next();
  } catch (err) {
    next(err);
  }
});

router.use(bodyParser.urlencoded({ extended: false }));

router.get("/", (req, res) => {
  if (req.user) {
    res.redirect("/dashboard");
  } else {
    res.render("index", {
      authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    });
  }
});

router.get("/dashboard", auth(), (req, res) => {
  if (req.user) {
    res.render("dashboard", {
      user: req.user
    });
  } else {
    res.redirect("/");
  }
});

router.get("/dashboard/notes", auth(), async (req, res) => {
  const data = await findNotesByUserId(req.db, req.user._id);
  return res.send({data});
});

router.get("/dashboard/note/:id", auth(), async (req, res) => {
  const note = await findNoteById(req.db, req.params.id);
  const converter = new showdown.Converter();
  note.html = converter.makeHtml(note.text);
  return res.send(note);
});

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const userId = await createUser(req.db, username, password);
  const token = await createToken(req.db, userId);
  await createDemoNote(req.db, userId);
  res.cookie("token", token).redirect("/dashboard");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(req.db, username);
  if (!user || user.password !== hash(password)) {
    return res.redirect("/?authError=true");
  }
  const token = await createToken(req.db, user._id);
  res.cookie("token", token).redirect("/dashboard");
});

router.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await deleteToken(req.db, req.token);
  res.clearCookie("token").redirect("/");
});

router.post("/dashboard/note/new", auth(), async (req, res) => {
  const { title, text } = req.body;
  console.log('title, text', title, text);
  const note = await createNote(req.db, req.user._id, title, text);
  res.send(note);
});

router.post("/dashboard/note/:id", auth(), async (req, res) => {
  const { title, text } = req.body;
  const modifiedCount = await updateNoteById(req.db, req.params.id, title, text);
  res.send({modifiedCount});
});

router.post("/dashboard/note/archive/:id", auth(), async (req, res) => {
  const { isArchive } = req.body;
  const modifiedCount = await updateArchiveStateNodeById(req.db, req.params.id, isArchive);
  res.send({modifiedCount});
});

router.delete("/dashboard/note/:id", auth(), async (req, res) => {
  const deletedCount = await deleteNoteById(req.db, req.params.id);
  res.send({deletedCount});
});
router.delete("/dashboard/deleteAllArchived", auth(), async (req, res) => {
  const deletedCount = await deleteAllArchived(req.db, req.user._id);
  res.send({deletedCount});
});

router.get('/auth/vkontakte',
  passport.authenticate('vkontakte'),
  function(req, res){
});

router.get('/auth/vkontakte/callback',
  passport.authenticate('vkontakte', {
    failureRedirect: '/login',
    session: false
   }),
  async function(req, res) {
    const username = req.user.username || req.user.id
    const user = await findUserByUsername(req.db, username);
    if (!user) {
      const userId = await createUser(req.db, username, req.user.profileUrl);
      const token = await createToken(req.db, userId);
      await createDemoNote(req.db, userId);
      res.cookie("token", token).redirect("/dashboard");
    } else {
        if (user.password !== hash(req.user.profileUrl)) {
          return res.render("index",
          {
            authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
          }
          );
        }
        const token = await createToken(req.db, user._id);
        res.cookie("token", token).redirect("/dashboard");
    }
});

module.exports = router;
