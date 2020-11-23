const User = require("../models/User");

const auth = (req, res, next) => {
  let token = req.cookies.jwt_auth;
  if (!token)
    return res.status(401).json({
      isAuth: false,
    });
  User.findByToken(token, (err, user) => {
    if (!user)
      return res.status(401).json({
        isAuth: false,
      });
    req.token = token;
    req.user = user;
    next();
  });
};

const admin = (req, res, next) => {
  if (req.user.adminRole) {
    next();
  } else return res.status(401).send("Denied!");
};

module.exports = { auth, admin };
