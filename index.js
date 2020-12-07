const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const herokuAwake = require("heroku-awake");
const cors = require("cors");
const app = express();

require("dotenv").config();
const port = process.env.PORT || 8000;

const url = "https://youtube-clone-client.herokuapp.com/";
const time = 10;
// app.use(cors());
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

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

app.listen(port, () => {
  herokuAwake(url, time);
  console.log(`App listening on port ${port}!`);
});
