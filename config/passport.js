const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LocalStrategy = require("passport-local").Strategy;

require("dotenv").config();
const User = require("../models/User");

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => {
		if (err) {
			return done(err);
		}
		user.password = ''
		done(null, user);
	});
});

/**
 * Sign in using Email and Password.
 */
passport.use(
	new LocalStrategy(
		{ usernameField: "email", passwordField: "password" },
		(email, password, done) => {
			User.findOne({ email: email.toLowerCase() }, (err, user) => {
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false, { email: "Email not found" });
				}
				if (!user.password) {
					return done(null, false, {
						email: "Your account was registered using a sign-in provider",
					});
				}

				user.comparePassword(password, (err, isMatch) => {
					if (err) {
						return done(err);
					}
					if (!isMatch) {
						return done(null, false, { password: "Invalid password" });
					}
					done(null, user);
				});
			});
		}
	)
);

/**
 * Sign in with Google.
 */
const googleStrategyConfig = new GoogleStrategy(
	{
		clientID: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		callbackURL: "https://api-youtubeclone.herokuapp.com/auth/google/callback",
	},
	(req, accessToken, refreshToken, profile, done) => {
		User.findOne(
			{ googleId: profile.id },
			(err, existingUser) => {
				if (err) {
					return done(err);
				}
				if (existingUser) {
					return done(null, existingUser);
				}
				User.findOne(
					{ email: profile.emails[0].value },
					(err, existingLocalUser) => {
						if (err) {
							return done(err);
						}
						if (existingLocalUser) {
							existingLocalUser.googleId = profile.id;
							existingLocalUser.save((err) => {
								done(err, existingLocalUser);
							});
						} else {
							const user = new User({
								email: profile.emails[0].value,
								googleId: profile.id,
								displayName: profile.displayName,
								avatar: profile._json.picture
							});
							user.save((err) => {
								done(err, user);
							});
						}
					}
				);
			}
		);
	}
);
passport.use("google", googleStrategyConfig);

/**
 * Sign in with Facebook.
 */
const facebookStrategyConfig = new FacebookStrategy(
	{
		clientID: process.env.FACEBOOK_CLIENT_ID,
		clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
		callbackURL: "https://api-youtubeclone.herokuapp.com/auth/facebook/callback",
		profileFields: ["id", "photos", "displayName", "email"],
	},
	(accessToken, refreshToken, profile, done) => {
		console.log(profile)
		// User.findOne(
		// 	{ facebookId: profile.id, verify: true },
		// 	(err, existingUser) => {
		// 		if (err) {
		// 			return done(err);
		// 		}
		// 		if (existingUser) {
		// 			return done(null, existingUser);
		// 		}
		// 		User.findOne(
		// 			{
		// 				email: profile.emails[0].value,
		// 			},
		// 			(err, existingEmailUser) => {
		// 				if (err) {
		// 					return done(err);
		// 				}
		// 				if (existingEmailUser) {
		// 					existingEmailUser.facebookId = profile.id;
		// 					existingEmailUser.save((err) => {
		// 						done(err, existingEmailUser);
		// 					});
		// 				} else {
		// 					const user = new User({
		// 						email: profile.emails[0].value,
		// 						facebookId: profile.id,
		// 						displayName: profile.displayName,
		// 						avatar: profile.photos[0].value
		// 					});
		// 					user.save((err) => {
		// 						done(err, user);
		// 					});
		// 				}
		// 			}
		// 		);
		// 	}
		// );
	}
);
passport.use("facebook", facebookStrategyConfig);