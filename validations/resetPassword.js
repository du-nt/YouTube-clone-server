const Validator = require("validator");

module.exports = ({ newPassword, newPassword2 }) => {
	let errors = {};

	if (Validator.isEmpty(newPassword)) {
		errors.newPassword = "New password field is required";
	}

	if (Validator.isEmpty(newPassword2)) {
		errors.newPassword2 = "Confirm new password is required";
	}

	if (!Validator.isLength(newPassword, { min: 6, max: 30 })) {
		errors.newPassword = "Password must between 6 and 30 characters";
	}
	if (!Validator.equals(newPassword, newPassword2)) {
		errors.newPassword2 = "New passwords must match";
	}
	return {
		errors,
		isValid: Object.keys(errors).length === 0,
	};
};
