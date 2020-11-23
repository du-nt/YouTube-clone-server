const { getVideoDurationInSeconds } = require("get-video-duration");

const { secondsToHms } = require("../utils/convertTime");
const Video = require("../models/Video");

const adminUpload = async (req, res) => {
  try {
    const seconds = await getVideoDurationInSeconds(req.body.url);
    const duration = secondsToHms(seconds);

    const ext = req.body.url.split(".").pop();
    const thumbnail = req.body.url.replace(ext, "jpg");

    const mewVideo = new Video({
      ...req.body,
      author: req.user._id,
      duration,
      thumbnail,
    });

    await mewVideo.save();
    console.log("object");

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400);
  }
};

module.exports = {
  adminUpload,
};
