const formidable = require("formidable");
const { upload } = require("../utils/helper");

const User = require("../models/User");

const getProfile = async (req, res) => {
  const user = await User.findOne({ userName: req.params.userName })
    .select("-password -token")
    .populate({ path: "posts", select: "filePaths commentsCount likesCount" })
    .populate({
      path: "savedPosts",
      select: "filePaths commentsCount likesCount",
    })
    .populate({ path: "followers", select: "avatar userName displayName" })
    .populate({ path: "following", select: "avatar userName displayName" })
    .lean()
    .exec();

  if (!user) {
    return res.status(404).json({
      error: `The user ${req.params.userName} is not found`,
    });
  }

  res.json(user);
};

const editUser = async (req, res) => {
  const { userName, email } = req.body;

  const existUser = await User.findOne({
    email,
    _id: { $ne: req.user.id },
  }).exec();
  const existUser1 = await User.findOne({
    userName,
    _id: { $ne: req.user.id },
  }).exec();
  if (existUser || existUser1) {
    let errors = {};
    if (existUser) {
      errors.email = "Email was used";
    }
    if (existUser1) {
      errors.userName = "Username was used";
    }
    return res.status(404).json(errors);
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: req.body },
    {
      new: true,
    }
  );
  res.json(user);
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

const removePhoto = async (req, res) => {
  const { avatar } = await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        avatar:
          "https://res.cloudinary.com/douy56nkf/image/upload/v1594060920/defaults/txxeacnh3vanuhsemfc8.png",
      },
    },
    {
      new: true,
    }
  );
  res.json({ avatar });
};

const searchUser = async (req, res) => {
  if (!req.query.userName) {
    return res.status(404).json({ message: "The username cannot be empty" });
  }
  const regex = new RegExp(req.query.userName, "i");
  const users = await User.find({
    $or: [{ userName: regex }, { displayName: regex }],
  });

  res.json(users);
};

module.exports = {
  getProfile,
  editUser,
  changePhoto,
  removePhoto,
  searchUser,
};
