require("dotenv").config();
const express = require("express");
const nunjucks = require("nunjucks");

const cookieParser = require("cookie-parser");
const app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    variableStart: "[[",
    variableEnd: "]]"
  },
});

app.set("view engine", "njk");
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use("/", require("./router"));

app.use((err, req, res, next) => {
  res
    .status(400)
    .send({
      message: err.message || 'Ошибка по умолчанию.'
    });
  next();
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
