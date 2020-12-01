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
    userName: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      required: true,
      type: String,
    },
    avatar: {
      type: String,
      default: "",
    },
    cover: {
      type: String,
      default:
        "https://media.istockphoto.com/vectors/vector-white-triangular-mosaic-texture-modern-low-poly-background-vector-id1200558861?b=1&k=6&m=1200558861&s=612x612&w=0&h=tEcC_NMFGARPnTQOxXYobgdAyVWvVYDRuK4-7_ZbEds=",
    },
    adminRole: {
      type: Boolean,
      default: false,
    },
    token: String,
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

userSchema.methods.generateToken = function (cb) {
  const user = this;
  var token = jwt.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: "1d",
  });
  user.token = token;
  user.save(function (err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};

userSchema.statics.findByToken = function (token, cb) {
  const user = this;
  jwt.verify(token, process.env.SECRET, function (err, decode) {
    if (err) return cb(err);
    user.findOne({ _id: decode.id, token: token }, function (err, user) {
      if (err) return cb(err);
      cb(null, user);
    });
  });
};

userSchema.set("toJSON", {
  transform: (doc, { __v, password, token, ...rest }, options) => rest,
});

module.exports = mongoose.model("User", userSchema);
