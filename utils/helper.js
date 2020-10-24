const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const upload = (file, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file.path,
      {
        folder,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          return resolve(result.secure_url);
        }
      }
    );
  });
};

module.exports = {
  upload,
};
