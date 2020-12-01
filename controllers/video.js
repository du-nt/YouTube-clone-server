const { getVideoDurationInSeconds } = require("get-video-duration");

const { secondsToHms } = require("../utils/convertTime");
const Video = require("../models/Video");
const Subscriber = require("../models/Subscriber");

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
  }
};

const recommendedVideos = async (req, res) => {
  const videos = await Video.find()
    .select(" -url -description -subtitle -updatedAt -__v")
    .populate({ path: "author", select: " avatar userName displayName" });
  res.json(videos);
};

const getSubscriptionVideos = async (req, res) => {
  const subscribers = await Subscriber.find({
    userFrom: req.user.id,
  }).populate({ path: "userTo", select: "avatar userName displayName" });

  const subscribedUsers = subscribers.map(
    (subscriber) => subscriber.userTo._id
  );
  const sixSubscribedUsers = subscribers
    .slice(0, 7)
    .map((subscriber) => subscriber.userTo);

  const videos = await Video.find({ author: { $in: subscribedUsers } })
    .select(" -url -description -subtitle -updatedAt -__v")
    .populate({ path: "author", select: " avatar userName displayName" });
  res.json({ videos, sixSubscribedUsers });
};

module.exports = {
  adminUpload,
  recommendedVideos,
  getSubscriptionVideos,
};
