const { getVideoDurationInSeconds } = require("get-video-duration");
const formidable = require("formidable");
const { upload_large } = require("../utils/helper");

const { secondsToHms } = require("../utils/convertTime");
const Video = require("../models/Video");
const Subscriber = require("../models/Subscriber");
const Comment = require("../models/Comment");
const Reply = require("../models/Reply");

const adminUpload = async (req, res) => {
  try {
    const seconds = await getVideoDurationInSeconds(req.body.url);
    const duration = secondsToHms(seconds);

    const ext = req.body.url.split(".").pop();
    const thumbnail = req.body.url.replace(ext, "jpg");

    const newVideo = new Video({
      ...req.body,
      author: req.user._id,
      duration,
      thumbnail,
    });

    await newVideo.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false });
    console.log(error);
  }
};

const recommendedVideos = async (req, res) => {
  const videos = await Video.find()
    .select(" -url -description -subtitle -updatedAt -__v")
    .populate({ path: "author", select: " avatar displayName" })
    .sort("-createdAt")
    .lean()
    .exec();
  res.json(videos);
};

const getSubscriptionVideos = async (req, res) => {
  const subscribers = await Subscriber.find({
    userFrom: req.user.id,
  }).populate({ path: "userTo", select: "avatar displayName" });

  const subscribedUsers = subscribers.map(
    (subscriber) => subscriber.userTo._id
  );

  const videos = await Video.find({ author: { $in: subscribedUsers } })
    .select(" -url -description -subtitle -updatedAt -__v")
    .populate({ path: "author", select: " avatar displayName" })
    .sort("-createdAt");

  const sixSubscribedUsers = subscribers
    .slice(0, 7)
    .map((subscriber) => subscriber.userTo);

  res.json({ videos, sixSubscribedUsers });
};

const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .select(" -thumbnail -duration -updatedAt -__v ")
      .populate({
        path: "author",
        select: " avatar displayName",
      })
      .lean()
      .exec();

    if (!video) {
      return res
        .status(404)
        .json({ error: `No video found for ID - ${req.params.videoId}` });
    }

    video.subscribersCount = await Subscriber.countDocuments({
      userTo: video.author._id,
    });

    video.commentsCount = await Comment.countDocuments({
      videoId: video._id,
    });

    if (video.commentsCount > 0) {
      video.firstComment = await Comment.findOne({ videoId: video._id })
        .select("text author")
        .populate({ path: "author", select: " avatar displayName" });
    }

    if (req.query.lgId) {
      video.isMe = video.author._id.toString() === req.query.lgId;
      const isSubscribed = await Subscriber.findOne({
        userTo: video.author._id.toString(),
        userFrom: req.query.lgId,
      });
      video.isSubscribed = !!isSubscribed;
      video.isLiked = video.likes.some(
        (like) => like.toString() === req.query.lgId
      );
      video.isDisliked = video.dislikes.some(
        (dislike) => dislike.toString() === req.query.lgId
      );
    }

    res.json(video);
  } catch (error) {
    res.status(404).send(error);
  }
};

const getRelatedVideos = async (req, res) => {
  const videos = await Video.find({ _id: { $ne: req.body._id } })
    .limit(12)
    .select(" -url -description -subtitle -updatedAt -createdAt -__v")
    .populate({ path: "author", select: "displayName" })
    .sort("-createdAt")
    .lean()
    .exec();
  res.json(videos);
};

const like = async (req, res) => {
  const video = await Video.findById(req.params.videoId);

  if (!video) {
    return res
      .status(404)
      .json({ error: `No video found for ID - ${req.params.videoId}` });
  }

  if (video.likes.includes(req.user.id)) {
    await video.updateOne({
      $pull: { likes: req.user.id },
      $inc: { likesCount: -1 },
    });
  } else if (video.dislikes.includes(req.user.id)) {
    await video.updateOne({
      $push: { likes: req.user.id },
      $pull: { dislikes: req.user.id },
      $inc: { likesCount: 1, dislikesCount: -1 },
    });
  } else {
    await video.updateOne({
      $push: { likes: req.user.id },
      $inc: { likesCount: 1 },
    });
  }

  res.json({ success: true });
};

const dislike = async (req, res) => {
  const video = await Video.findById(req.params.videoId);

  if (!video) {
    return res
      .status(404)
      .json({ error: `No video found for ID - ${req.params.videoId}` });
  }

  if (video.dislikes.includes(req.user.id)) {
    await video.updateOne({
      $pull: { dislikes: req.user.id },
      $inc: { dislikesCount: -1 },
    });
  } else if (video.likes.includes(req.user.id)) {
    await video.updateOne({
      $push: { dislikes: req.user.id },
      $pull: { likes: req.user.id },
      $inc: { dislikesCount: 1, likesCount: -1 },
    });
  } else {
    await video.updateOne({
      $push: { dislikes: req.user.id },
      $inc: { dislikesCount: 1 },
    });
  }

  res.json({ success: true });
};

const upView = async (req, res) => {
  const video = await Video.findById(req.params.videoId);

  if (!video) {
    return res
      .status(404)
      .json({ error: `No video found for ID - ${req.params.videoId}` });
  }

  await video.updateOne({
    $inc: { views: 1 },
  });

  res.json({ success: true });
};

const addComment = async (req, res) => {
  try {
    const newComment = Comment({
      text: req.body.text,
      author: req.user.id,
      videoId: req.body._id,
    });
    await newComment.save();

    await newComment
      .populate({
        path: "author",
        select: " avatar displayName",
      })
      .execPopulate();

    res.json(newComment);
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      videoId: req.params.videoId,
    })
      .populate({ path: "author", select: " avatar displayName" })
      .sort("-createdAt")
      .lean()
      .exec();

    for (const comment of comments) {
      comment.commentsCount = await Reply.countDocuments({
        commentId: comment._id,
      });
      if (req.query.lgId) {
        comment.isLiked = comment.likes.some(
          (like) => like.toString() === req.query.lgId
        );
        comment.isDisliked = comment.dislikes.some(
          (dislike) => dislike.toString() === req.query.lgId
        );
      }
    }

    res.json(comments);
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const addReply = async (req, res) => {
  try {
    const newReply = Reply({
      text: req.body.text,
      author: req.user.id,
      commentId: req.body._id,
      responseTo: req.body.responseTo,
    });
    await newReply.save();

    await newReply
      .populate([
        {
          path: "author",
          select: " avatar displayName",
        },
        { path: "responseTo", select: " displayName" },
      ])
      .execPopulate();
    res.json(newReply);
  } catch (error) {
    console.log(error);
    res.status(404).json({ success: false });
  }
};

const getReplies = async (req, res) => {
  try {
    const replies = await Reply.find({
      commentId: req.params.commentId,
    })
      .populate([
        { path: "author", select: " avatar displayName" },
        { path: "responseTo", select: "displayName" },
      ])
      .lean()
      .exec();

    if (req.query.lgId) {
      replies.forEach((reply) => {
        reply.isLiked = reply.likes.some(
          (like) => like.toString() === req.query.lgId
        );
        reply.isDisliked = reply.dislikes.some(
          (dislike) => dislike.toString() === req.query.lgId
        );
      });
    }

    res.json(replies);
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const deleteReply = async (req, res) => {
  try {
    await Reply.findByIdAndDelete(req.params.replyId);

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.commentId);
    await Reply.deleteMany({ commentId: req.params.commentId });

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (comment.likes.includes(req.user.id)) {
      await comment.updateOne({
        $pull: { likes: req.user.id },
        $inc: { likesCount: -1 },
      });
    } else if (comment.dislikes.includes(req.user.id)) {
      await comment.updateOne({
        $push: { likes: req.user.id },
        $pull: { dislikes: req.user.id },
        $inc: { likesCount: 1, dislikesCount: -1 },
      });
    } else {
      await comment.updateOne({
        $push: { likes: req.user.id },
        $inc: { likesCount: 1 },
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const dislikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (comment.dislikes.includes(req.user.id)) {
      await comment.updateOne({
        $pull: { dislikes: req.user.id },
        $inc: { dislikesCount: -1 },
      });
    } else if (comment.likes.includes(req.user.id)) {
      await comment.updateOne({
        $push: { dislikes: req.user.id },
        $pull: { likes: req.user.id },
        $inc: { dislikesCount: 1, likesCount: -1 },
      });
    } else {
      await comment.updateOne({
        $push: { dislikes: req.user.id },
        $inc: { dislikesCount: 1 },
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const likeReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId);

    if (reply.likes.includes(req.user.id)) {
      await reply.updateOne({
        $pull: { likes: req.user.id },
        $inc: { likesCount: -1 },
      });
    } else if (reply.dislikes.includes(req.user.id)) {
      await reply.updateOne({
        $push: { likes: req.user.id },
        $pull: { dislikes: req.user.id },
        $inc: { likesCount: 1, dislikesCount: -1 },
      });
    } else {
      await reply.updateOne({
        $push: { likes: req.user.id },
        $inc: { likesCount: 1 },
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const dislikeReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId);

    if (reply.dislikes.includes(req.user.id)) {
      await reply.updateOne({
        $pull: { dislikes: req.user.id },
        $inc: { dislikesCount: -1 },
      });
    } else if (reply.likes.includes(req.user.id)) {
      await reply.updateOne({
        $push: { dislikes: req.user.id },
        $pull: { likes: req.user.id },
        $inc: { dislikesCount: 1, likesCount: -1 },
      });
    } else {
      await reply.updateOne({
        $push: { dislikes: req.user.id },
        $inc: { dislikesCount: 1 },
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

// const uploadVideo = async (req, res) => {
//   const form = formidable();
//   form.parse(req, (err, fields, file) => {
//     if (err) {
//       return res.status(404).json({ error: "Errored" });
//     }
//     if (file) {
//       upload_large(file.files, "uploadedVideos")
//         .then(async ({ url, seconds }) => {
//           const duration = secondsToHms(seconds);
//           const ext = url.split(".").pop();
//           const thumbnail = url.replace(ext, "jpg");

//           const newVideo = new Video({
//             ...fields,
//             author: req.user._id,
//             url,
//             duration,
//             thumbnail,
//           });

//           await newVideo.save();

//           res.status(200).json(newVideo);
//         })
//         .catch((err) => {
//           res.status(404).json({ success: false, error: err.message });
//           console.log(err);
//         });
//     } else {
//       res.status(404).json({ error: "No video provided" });
//     }
//   });
// };

const uploadVideo = async (req, res) => {
  try {
    const seconds = await getVideoDurationInSeconds(req.body.url);
    const duration = secondsToHms(seconds);

    const ext = req.body.url.split(".").pop();
    const thumbnail = req.body.url.replace(ext, "jpg");

    const newVideo = new Video({
      ...req.body,
      author: req.user._id,
      duration,
      thumbnail,
    });

    await newVideo.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false });
    console.log(error);
  }
};

module.exports = {
  adminUpload,
  recommendedVideos,
  getSubscriptionVideos,
  getVideo,
  getRelatedVideos,
  like,
  dislike,
  upView,
  addComment,
  getComments,
  addReply,
  getReplies,
  deleteReply,
  deleteComment,
  likeComment,
  dislikeComment,
  likeReply,
  dislikeReply,
  uploadVideo,
};
