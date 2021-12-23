const jwt = require("jsonwebtoken");
const passport = require("passport");

const User = require("../models/User");
const Subscriber = require("../models/Subscriber");

const validateRegisterInput = require("../validations/register");
const validateLoginInput = require("../validations/login");
const validateChangePassword = require("../validations/changePassword");
const validateResetPassword = require("../validations/resetPassword");
const { transporter, resetPasswordTemplate } = require("../utils/nodemail");

const auth = async (req, res) => {
  const subscribedUsers = await Subscriber.find({ userFrom: req.user.id })
    .select("userTo")
    .populate({ path: "userTo", select: " avatar displayName" })
    .lean()
    .exec();

  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.isAdmin,
    email: req.user.email,
    displayName: req.user.displayName,
    avatar: req.user.avatar,
    cover: req.user.cover,
    subscribedUsers
  });
};

const register = async (req, res) => {
  try {
    const { isValid, errors } = validateRegisterInput(req.body);

    if (!isValid) {
      return res.status(404).json(errors);
    }
    const { email, displayName, password } = req.body;
    const user = await User.findOne({ email }).exec();
    if (user) {
      return res.status(404).json({ email: "Email was used" });
    }
    const newUser = new User({
      displayName,
      email,
      password,
    });
    await newUser.save();
    res.status(200).json({
      registerSuccess: true,
    });
  } catch (err) {
    res.status(404).json({ registerSuccess: false, error: err.message });
  }
};

const login = (req, res, next) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(404).json(errors);
  }

  passport.authenticate("local", async(err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(404).json(info);
    }

    const subscribedUsers = await Subscriber.find({ userFrom: user.id })
    .select("userTo")
    .populate({ path: "userTo", select: " avatar displayName" })
    .lean()
    .exec();

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json({
        _id: user._id,
        isAdmin: user.isAdmin,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        cover: user.cover,
        subscribedUsers
      });
    });
  })(req, res, next);
};

// const changePassword = (req, res) => {
//   try {
//     const { errors, isValid } = validateChangePassword(req.body);

//     if (!isValid) {
//       return res.status(404).json(errors);
//     }
//     const { oldPassword, newPassword } = req.body;
//     const { user } = req;

//     user.comparePassword(oldPassword, (err, isMatch) => {
//       if (err) {
//         return res.status(401).json({ success: false, error: err.message });
//       }
//       if (!isMatch) {
//         errors.oldPassword = "Invalid old password";
//         return res.status(401).json(errors);
//       }
//       user.password = newPassword;
//       user
//         .save()
//         .then(() => {
//           res.status(200).json({ success: true });
//         })
//         .catch((err) => {
//           res.status(500).json({
//             success: false,
//             error: err.message,
//           });
//         });
//     });
//   } catch (err) {
//     res.status(404).json({ success: false, error: err.message });
//   }
// };

const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).exec();

    if (!user) {
      throw new Error("User does not exist");
    }

    if (!user.password) {
      throw new Error("Your account was registered using a sign-in provider")
    }

    const secret = user.password + "-" + user.createdAt;
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: 600 });
    const url = `${process.env.RESET_PASSWORD_URL}/${user._id}/${token}`;
    const emailTemplate = resetPasswordTemplate(user, url);

    transporter.sendMail(emailTemplate, (err, info) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Something went wrong" });
      }
      res.status(200).json({ success: true });
    });
    transporter.close();
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

const receiveNewPassword = async (req, res) => {
  try {
    const { errors, isValid } = validateResetPassword(req.body);

    if (!isValid) {
      return res.status(404).json(errors);
    }

    const { userId, token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ _id: userId }).exec();
    if (!user) {
      throw new Error("User does not exist");
    }
    const secret = user.password + "-" + user.createdAt;
    jwt.verify(token, secret);
    user.password = newPassword;
    await user.save();
    res.status(202).json({ success: true });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

const logout = (req, res) => {
  req.logout();
  res.status(200).json({
    logoutSuccess: true,
  });
};

module.exports = {
  register,
  login,
  logout,
  // changePassword,
  sendPasswordResetEmail,
  receiveNewPassword,
  auth,
};
