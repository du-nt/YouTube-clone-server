const isLogged = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({
      isAuth: false,
      error: "Not permitted",
    });
  }
};

const isNotLogged = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(404).json({
      error: "You're logged in",
    });
  } else {
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(401).json({
      isAuth: false,
      error: "Only admin user can do this",
    });
  }
  next();
};


module.exports = { isLogged, isAdmin, isNotLogged };
