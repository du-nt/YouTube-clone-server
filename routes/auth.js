const express = require("express");
const router = express.Router();

const { isLogged, isNotLogged } = require("../middlewares/auth");
const authControllers = require("../controllers/auth");

router.get("/", isLogged, authControllers.auth);

router.post("/register", isNotLogged, authControllers.register);

router.post("/login", isNotLogged, authControllers.login);

router.get("/logout", isLogged, authControllers.logout);

// router.post("/changePassword", isLogged, authControllers.changePassword);

router.get(
  "/resetPassword/user/:email",
  authControllers.sendPasswordResetEmail
);

router.post(
  "/receiveNewPassword/:userId/:token",
  authControllers.receiveNewPassword
);

module.exports = router;
