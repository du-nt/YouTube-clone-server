const formidable = require("formidable");
const { upload } = require("../utils/helper");

const User = require("../models/User");
const Subscriber = require("../models/Subscriber");
const Video = require("../models/Video");

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userName: req.params.userName })
      .select("displayName avatar cover")
      .lean()
      .exec();

    if (!user) {
      return res.status(404).json({
        error: `The user ${req.params.userName} is not found`,
      });
    }

    const otherSubscribe = await Subscriber.find({
      userTo: user._id.toString(),
    });

    user.subscribersCount = otherSubscribe.length;

    if (req.query.lgId) {
      const subscribe = await Subscriber.find({
        userTo: user._id.toString(),
        userFrom: req.query.lgId,
      });

      user.isMe = user._id.toString() === req.query.lgId;
      user.isSubscribed = subscribe.length > 0;
    }

    res.json(user);
  } catch (error) {
    res.status(400).send(err);
  }
};

const editUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    { $set: req.body },
    {
      new: true,
    }
  );
  res.json({ success: true });
};

const changePhoto = async (req, res) => {
  const form = formidable();

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(404).json({ error: "Errored" });
    }
    if (file) {
      upload(file.file, "avatar")
        .then(async (url) => {
          const { avatar } = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { avatar: url } },
            {
              new: true,
            }
          );
          res.json({ avatar });
        })
        .catch((err) =>
          res.status(404).json({ success: false, error: err.message })
        );
    } else {
      res.status(404).json({ error: "No image provided" });
    }
  });
};

const changeCover = async (req, res) => {
  const form = formidable();

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(404).json({ error: "Errored" });
    }
    if (file) {
      upload(file.file, "cover")
        .then(async (url) => {
          const { cover } = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { cover: url } },
            {
              new: true,
            }
          );
          res.json({ cover });
        })
        .catch((err) =>
          res.status(404).json({ success: false, error: err.message })
        );
    } else {
      res.status(404).json({ error: "No image provided" });
    }
  });
};

const toggleSubscribe = async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(404).json({ error: "You can't subscribe yourself" });
    }

    const subscribe = await Subscriber.findOne({
      userTo: req.params.userId,
      userFrom: req.user.id,
    });

    if (!subscribe) {
      const newSubscribe = new Subscriber({
        userTo: req.params.userId,
        userFrom: req.user.id,
      });
      await newSubscribe.save();
    } else {
      await Subscriber.findOneAndDelete({
        userTo: req.params.userId,
        userFrom: req.user.id,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

const getUserVideos = async (req, res) => {
  const videos = await Video.find({ author: req.params.userId })
    .select("title thumbnail views duration createdAt")
    .sort("-createdAt");
  res.json(videos);
};

const getSubscribedUsers = async (req, res) => {
  const users = await Subscriber.find({ userFrom: req.user.id })
    .select("userTo")
    .populate({ path: "userTo", select: " avatar userName displayName" })
    .lean()
    .exec();
  res.status(200).json(users);
};

const search = async (req, res) => {
  if (!req.query.q) {
    return res.status(404).json({ message: "The search term cannot be empty" });
  }
  const regex = new RegExp(req.query.q, "i");

  const results = await Promise.all([
    User.find({
      $or: [{ userName: regex }, { displayName: regex }],
    })
      .select("displayName avatar userName")
      .lean()
      .exec(),
    Video.find({ title: regex })
      .select("author title thumbnail views duration createdAt")
      .populate({ path: "author", select: "displayName" })
      .lean()
      .exec(),
    ,
  ]);

  if (!results[0].length) return res.json({ users: [], videos: results[1] });

  results[0].forEach(async (user, index) => {
    user.subscribersCount = await Subscriber.countDocuments({
      userTo: user._id.toString(),
    });
    user.videosCount = await Video.countDocuments({
      author: user._id.toString(),
    });
    if (index === results[0].length - 1) {
      res.json({ users: results[0], videos: results[1] });
    }
  });
};

module.exports = {
  getProfile,
  editUser,
  changePhoto,
  changeCover,
  toggleSubscribe,
  getUserVideos,
  getSubscribedUsers,
  search,
};
