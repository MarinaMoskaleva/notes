const { findUserByToken } = require("./db");

module.exports.auth = () => async (req, res, next) => {
  if (!req.cookies["token"]) {
    return next(new Error('Необходима авторизация!'));
  }
  const user = await findUserByToken(req.db, req.cookies["token"]);
  req.user = user;
  req.token = req.cookies["token"];
  next();
};
