const express = require("express");
const router = express.Router();

const { auth } = require("../middlewares/auth");
const userControllers = require("../controllers/users");

router.get("/search", userControllers.searchUser);

router.post("/editUser", auth, userControllers.editUser);

router.post("/changePhoto", auth, userControllers.changePhoto);

router.get("/removePhoto", auth, userControllers.removePhoto);

router.get("/user/:userName",auth, userControllers.getProfile);

module.exports = router;
