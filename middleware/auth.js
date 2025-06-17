const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect(`/signup?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.redirect(`/signup?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
};