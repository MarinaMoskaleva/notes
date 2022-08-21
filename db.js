const { ObjectId } = require("mongodb");
const { nanoid } = require("nanoid");
const { createHash } = require("crypto");

const hash = (d) => createHash("sha256").update(d).digest("hex");

module.exports.hash = hash;

module.exports.findUserByUsername = async (db, username) => await db.collection("users").findOne({ username });

module.exports.createUser = async (db, username, password) => {
  const { insertedId } = await db.collection("users").insertOne({
    username,
    password: hash(password),
  });
  return insertedId;
};

module.exports.createToken = async (db, userId) => {
  const token = nanoid();
  await db.collection("tokens").insertOne({
    userId,
    token,
  });
  return token;
};

module.exports.deleteToken = async (db, token) => {
  await db.collection("tokens").deleteOne({ token });
};

module.exports.findUserByToken = async (db, token) => {
  const myToken = await db.collection("tokens").findOne(
    { token },
    {
      projection: { userId: 1 },
    }
  );
  if (!myToken) {
    return;
  }
  return db.collection("users").findOne({ _id: ObjectId(myToken.userId) });
};

module.exports.createNote = async (db, userId, title, text) => {
  const newNote = {
    userId,
    created: new Date(),
    title,
    text,
    isArchived: false,
  }

  const { insertedId } = await db.collection("notes").insertOne(newNote);
  newNote._id = insertedId;
  return newNote;
};

module.exports.findNotesByUserId = async (db, userId) => {
  const notes = await db.collection("notes").find({ userId }).toArray();
  return notes;
};

module.exports.findNoteById = async (db, noteId) => {
  const note = await db.collection("notes").findOne(
    { _id: ObjectId(noteId) },
  );
  return note;
};

module.exports.updateNoteById = async (db, noteId, title, text) => {
  const { modifiedCount } = await db.collection("notes").updateOne(
    { _id: ObjectId(noteId) },
    {
      $set: {
        title,
        text,
      },
    }
  );
  return modifiedCount;
};
module.exports.updateArchiveStateNodeById = async (db, noteId, inArchive) => {
  const { modifiedCount } = await db.collection("notes").updateOne(
    { _id: ObjectId(noteId) },
    {
      $set: {
        isArchived: inArchive,
      },
    }
  );
  return modifiedCount;
};

module.exports.deleteNoteById = async (db, noteId) => {
  const { deletedCount } =  await db.collection("notes").deleteOne({ _id: ObjectId(noteId) });
  return deletedCount;
};

module.exports.deleteAllArchived = async (db, userId) => {
  const { deletedCount } =  await db.collection("notes").deleteMany({
    userId: ObjectId(userId),
    "isArchived" : true
  });
  return deletedCount;
};
