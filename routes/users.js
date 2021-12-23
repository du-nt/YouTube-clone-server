const express = require("express");
const router = express.Router();

const { isLogged } = require("../middlewares/auth");
const userControllers = require("../controllers/users");

router.get("/search", userControllers.search);

router.post("/editUser", isLogged, userControllers.editUser);

router.post("/changePhoto", isLogged, userControllers.changePhoto);

router.post("/changeCover", isLogged, userControllers.changeCover);

router.get("/:userId", userControllers.getProfile);

router.get("/:userId/toggleSubscribe", isLogged, userControllers.toggleSubscribe);

router.get("/:userId/videos", userControllers.getUserVideos);

router.get(
  "/channel/subscribedUsers",
  isLogged,
  userControllers.getSubscribedUsers
);

module.exports = router;
