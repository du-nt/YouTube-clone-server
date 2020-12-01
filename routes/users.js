const express = require("express");
const router = express.Router();

const { auth } = require("../middlewares/auth");
const userControllers = require("../controllers/users");

router.get("/search", userControllers.searchUser);

router.post("/editUser", auth, userControllers.editUser);

router.post("/changePhoto", auth, userControllers.changePhoto);

router.post("/changeCover", auth, userControllers.changeCover);

router.get("/:userName", userControllers.getProfile);

router.get("/:userId/toggleSubscribe", auth, userControllers.toggleSubscribe);

router.get("/:userId/videos", userControllers.getUserVideos);

module.exports = router;
