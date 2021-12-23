const express = require("express");
const router = express.Router();

const { isLogged, isAdmin } = require("../middlewares/auth");
const videoController = require("../controllers/video");

router.post("/adminUpload", isLogged, isAdmin, videoController.adminUpload);

router.post("/upload", isLogged, videoController.uploadVideo);

router.get("/recommendedVideos", videoController.recommendedVideos);

router.get(
  "/getSubscriptionVideos",
  isLogged,
  videoController.getSubscriptionVideos
);

router.get("/:videoId", videoController.getVideo);

router.post("/relatedVideos", videoController.getRelatedVideos);

router.get("/like/:videoId", isLogged, videoController.like);

router.get("/dislike/:videoId", isLogged, videoController.dislike);

router.get("/upView/:videoId", videoController.upView);

router.post("/addComment", isLogged, videoController.addComment);

router.get("/getComments/:videoId", videoController.getComments);

router.get("/deleteComment/:commentId", isLogged, videoController.deleteComment);

router.post("/addReply", isLogged, videoController.addReply);

router.get("/getReplies/:commentId", videoController.getReplies);

router.get("/deleteReply/:replyId", isLogged, videoController.deleteReply);

router.get("/likeComment/:commentId", isLogged, videoController.likeComment);

router.get("/dislikeComment/:commentId", isLogged, videoController.dislikeComment);

router.get("/likeReply/:replyId", isLogged, videoController.likeReply);

router.get("/dislikeReply/:replyId", isLogged, videoController.dislikeReply);

module.exports = router;
