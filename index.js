const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const cookieSession = require("cookie-session");
const passport = require("passport");
const app = express();

require("dotenv").config();

const { isNotLogged } = require("./middlewares/auth");

require("./config/passport");

const port = process.env.PORT || 8000;

app.use(
  cors({
    credentials: true,
    origin: 'https://youtubeclone-yaokaoya.netlify.app/',
  })
);

app.use(
  cookieSession({
    maxAge: 1209600000, // two weeks in milliseconds
    keys: [process.env.SECRET], //
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => res.send("Hello World!"));

app.use("/api/users", require("./routes/users"));
app.use("/api/video", require("./routes/video"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));

app.get(
  "/auth/google",
  isNotLogged,
  (req, res, next) => {
    req.session.returnTo = req.query.returnTo;
    next();
  }, passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get("/auth/google/callback", function (req, res, next) {
  passport.authenticate("google", function (err, user) {

    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;

    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login`);
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(`${process.env.CLIENT_URL}${returnTo}`);
    });

  })(req, res, next);
});

app.get("/auth/facebook", isNotLogged, (req, res, next) => {
  req.session.returnTo = req.query.returnTo;
  next();
}, passport.authenticate("facebook"));

app.get("/auth/facebook/callback", function (req, res, next) {
  passport.authenticate("facebook", function (err, user) {

    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;

    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login`);
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(`${process.env.CLIENT_URL}${returnTo}`);
    });
  })(req, res, next);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
