const express = require("express");
const router = express.Router();

const { auth } = require("../middlewares/auth");
const authControllers = require("../controllers/auth");

router.get("/", auth, authControllers.auth);

router.post("/register", authControllers.register);

router.post("/login", authControllers.login);

router.get("/logout", auth, authControllers.logout);

router.post("/changePassword", auth, authControllers.changePassword);

router.get(
  "/resetPassword/user/:email",
  authControllers.sendPasswordResetEmail
);

router.post(
  "/receiveNewPassword/:userId/:token",
  authControllers.receiveNewPassword
);

module.exports = router;
