const express = require("express");
const router = express.Router();

const { isLogged, isAdmin } = require("../middlewares/auth");
const adminController = require("../controllers/admin");

router.get("/getUsers", isLogged, isAdmin, adminController.getUsers);

router.get("/getVideos", isLogged, isAdmin, adminController.getVideos);

router.get("/deleteUser/:userId", isLogged, isAdmin, adminController.deleteUser);

router.get("/deleteVideo/:videoId", isLogged, isAdmin, adminController.deleteVideo);

module.exports = router;
