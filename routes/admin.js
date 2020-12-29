const express = require("express");
const router = express.Router();

const { auth, admin } = require("../middlewares/auth");
const adminController = require("../controllers/admin");

router.get("/getUsers", auth, admin, adminController.getUsers);

router.get("/getVideos", auth, admin, adminController.getVideos);

router.get("/deleteUser/:userId", auth, admin, adminController.deleteUser);

router.get("/deleteVideo/:videoId", auth, admin, adminController.deleteVideo);

module.exports = router;
