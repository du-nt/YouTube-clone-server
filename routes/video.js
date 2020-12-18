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

router.post("/addComment", auth, videoController.addComment);

router.get("/getComments/:videoId", videoController.getComments);

router.get("/deleteComment/:commentId", auth, videoController.deleteComment);

router.post("/addReply", auth, videoController.addReply);

router.get("/getReplies/:commentId", videoController.getReplies);

router.get("/deleteReply/:replyId", auth, videoController.deleteReply);

module.exports = router;
