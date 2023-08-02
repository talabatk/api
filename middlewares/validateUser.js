const User = require("../models/user");

const validateUser = async (req, res, next) => {
  const { email, phone } = req.body;

  // Check if email or phone already exists in the database
  let userWithPhone = null,
    userWithEmail = null;

  if (email) {
    userWithEmail = await User.findOne({ where: { email } });
  }
  if (userWithPhone) {
    userWithPhone = await User.findOne({ where: { phone } });
  }

  if (userWithEmail || userWithPhone) {
    return res.status(400).json({ error: "email or phone already exist" });
  }

  next();
};

module.exports = validateUser;
