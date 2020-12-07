const mongoose = require("mongoose");

const videoSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    description: {
      type: String,
    },
    duration: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: {
      type: Number,
      default: 0,
    },
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
