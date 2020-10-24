const Validator = require("validator");

module.exports = (data) => {
	let errors = {};

	if (Validator.isEmpty(data.email)) {
		errors.email = "Email field is required";
	}

	if (!Validator.isEmail(data.email)) {
		errors.email = "Email is invalid";
	}

	if (Validator.isEmpty(data.userName)) {
		errors.userName = "Username field is required";
	}

	if (!Validator.isLength(data.userName, { min: 8, max: 30 })) {
		errors.userName = "Username must between 8 and 30 characters";
	}

	if (Validator.isEmpty(data.displayName)) {
		errors.displayName = "Display name field is required";
	}

	if (!Validator.isLength(data.displayName, { min: 8, max: 15 })) {
		errors.displayName = "Display name must between 8 and 15 characters";
	}

	if (Validator.isEmpty(data.password)) {
		errors.password = "Password field is required";
	}

	if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
		errors.password = "Password must between 6 and 30 characters";
	}

	if (Validator.isEmpty(data.password2)) {
		errors.password2 = "Confirm password is required";
	}

	if (!Validator.equals(data.password, data.password2)) {
		errors.password2 = "Passwords must match";
	}

	return {
		errors,
		isValid: Object.keys(errors).length === 0,
	};
};
