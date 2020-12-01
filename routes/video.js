const express = require("express");
const router = express.Router();

const { auth, admin } = require("../middlewares/auth");
const videoController = require("../controllers/video");

router.post("/adminUpload", auth, admin, videoController.adminUpload);

router.get("/recommendedVideos", videoController.recommendedVideos);

router.get(
  "/getSubscriptionVideos",
  auth,
  videoController.getSubscriptionVideos
);

module.exports = router;
