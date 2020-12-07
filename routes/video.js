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

router.get("/:videoId", videoController.getVideo);

router.post("/relatedVideos", videoController.getRelatedVideos);

router.get("/like/:videoId", auth, videoController.like);

router.get("/dislike/:videoId", auth, videoController.dislike);

router.get("/upView/:videoId", videoController.upView);

module.exports = router;
