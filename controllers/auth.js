const jwt = require("jsonwebtoken");

const User = require("../models/User");

const validateRegisterInput = require("../validations/register");
const validateLoginInput = require("../validations/login");
const validateChangePassword = require("../validations/changePassword");
const validateResetPassword = require("../validations/resetPassword");
const { transporter, resetPasswordTemplate } = require("../utils/nodemail");

const auth = async (req, res) => {
  res.status(200).json(req.user);
};

const register = async (req, res) => {
  try {
    const { isValid, errors } = validateRegisterInput(req.body);

    if (!isValid) {
      return res.status(404).json(errors);
    }
    const { email, userName, displayName, password } = req.body;
    const user = await User.findOne({ email }).exec();
    const user1 = await User.findOne({ userName }).exec();
    if (user || user1) {
      if (user) {
        errors.email = "Email was used";
      }
      if (user1) {
        errors.userName = "Username was used";
      }
      return res.status(404).json(errors);
    }
    const newUser = new User({
      userName,
      displayName,
      email,
      password,
    });
    await newUser.save();
    res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

const login = (req, res) => {
  try {
    const { errors, isValid } = validateLoginInput(req.body);

    if (!isValid) {
      return res.status(404).json(errors);
    }

    User.findOne({ email: req.body.email }, (err, user) => {
      if (!user) {
        errors.email = "Email not found";
        return res.status(404).json(errors);
      }
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (err) {
          return res.status(404).json({ success: false, error: err.message });
        }
        if (!isMatch) {
          errors.password = "Password is incorrect";
          return res.status(404).json(errors);
        }
        user.generateToken((err, user) => {
          if (err) {
            return res.status(403).json({ success: false, error: err.message });
          }
          res
            .cookie("jwt_auth", user.token, { httpOnly: true })
            .status(200)
            .json({ success: true });
        });
      });
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

const changePassword = (req, res) => {
  try {
    const { errors, isValid } = validateChangePassword(req.body);

    if (!isValid) {
      return res.status(404).json(errors);
    }
    const { oldPassword, newPassword } = req.body;
    const { user } = req;

    user.comparePassword(oldPassword, (err, isMatch) => {
      if (err) {
        return res.status(401).json({ success: false, error: err.message });
      }
      if (!isMatch) {
        errors.oldPassword = "Invalid old password";
        return res.status(401).json(errors);
      }
      user.password = newPassword;
      user
        .save()
        .then(() => {
          res.status(200).json({ success: true });
        })
        .catch((err) => {
          res.status(500).json({
            success: false,
            error: err.message,
          });
        });
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).exec();
    if (!user) {
      throw new Error("User does not exist");
    }
    const secret = user.password + "-" + user.createdAt;
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: 600 });
    const url = `${process.env.RESET_PASSWORD_URL}/${user._id}/${token}`;
    const emailTemplate = resetPasswordTemplate(user, url);

    transporter.sendMail(emailTemplate, (err, info) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
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
  try {
    User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, doc) => {
      if (err) return res.status(404).json({ success: false });
      res.clearCookie("jwt_auth").status(200).json({ success: true });
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  changePassword,
  sendPasswordResetEmail,
  receiveNewPassword,
  auth,
};
