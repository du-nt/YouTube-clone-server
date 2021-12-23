const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    avatar: {
      type: String,
      default: "",
    },
    cover: {
      type: String,
      default:
        "https://wallpapercave.com/wp/wp3414790.jpg",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    googleId: String,
    facebookId: String,
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  const user = this;
  if (user.isModified("password")) {
    bcrypt.hash(user.password, saltRounds, function (err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassword = function (plainPassword, cb) {
  bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

userSchema.set("toJSON", {
  transform: (doc, { __v, password, token, ...rest }, options) => rest,
});

module.exports = mongoose.model("User", userSchema);
