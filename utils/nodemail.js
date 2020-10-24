const nodemailer = require("nodemailer");

require("dotenv").config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_LOGIN,
		pass: process.env.EMAIL_PASSWORD,
	},
});

const resetPasswordTemplate = (user, url) => {
	const from = `Snaked Nadeved<${process.env.EMAIL_LOGIN}>`;
	const to = user.email;
	const subject = "Password reset";
	const html = `
  <p>Hey ${user.userName || user.email},</p>
  <p>We heard that you lost your  password. Sorry about that!</p>
  <p>But don’t worry! You can use the following link to reset your password:</p>
  <a href=${url}>${url}</a>
  <p>If you don’t use this link within 1 hour, it will expire.</p>
  <p>Do something outside today! </p>
  <p>–Your friends </p>
  `;
	return { from, to, subject, html };
};

module.exports = {
	transporter,
	resetPasswordTemplate,
};
