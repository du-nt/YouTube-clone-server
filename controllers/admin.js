const Video = require("../models/Video");
const Subscriber = require("../models/Subscriber");
const Comment = require("../models/Comment");
const Reply = require("../models/Reply");
const User = require("../models/User");

const getUsers = async (req, res) => {
  const users = await User.find()
    .select(" avatar displayName adminRole")
    .exec();
  res.json(users);
};

const getVideos = async (req, res) => {
  const videos = await Video.find()
    .select(" title thumbnail author ")
    .populate({ path: "author", select: " displayName" })
    .exec();
  res.json(videos);
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    await Subscriber.deleteMany({ userTo: user._id });
    await Subscriber.deleteMany({ userFrom: user._id });

    const videos = await Video.find({ author: user._id });
    await Video.deleteMany({ author: user._id });
    const videoIds = videos.map((video) => video._id);
    const comments = await Comment.find({ videoId: { $in: videoIds } });
    await Comment.deleteMany({ videoId: { $in: videoIds } });
    const commentIds = comments.map((comment) => comment._id);
    await Reply.deleteMany({ commentId: { $in: commentIds } });

    await Comment.deleteMany({ author: user._id });
    await Reply.deleteMany({ author: user._id });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.videoId);
    if (video) {
      const comments = await Comment.find({ videoId: video._id });
      await Comment.deleteMany({ videoId: video._id });
      const commentIds = comments.map((comment) => comment._id);
      await Reply.deleteMany({ commentId: { $in: commentIds } });

      res.json({ success: true });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getUsers,
  getVideos,
  deleteUser,
  deleteVideo,
};
