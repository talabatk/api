const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
//models===================
const User = require("../models/user");

//generate token=======================
const generateToken = (userId) => {
  const token = jwt.sign({ userId }, "talabatek2309288/k_ss-jdls88", {
    expiresIn: "5400h",
  });
  return token;
};

exports.register = async (req, res) => {
  const { phone, email, address, name, fcm, password, confirm_password } =
    req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ error: "passwords not matched" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      address,
      email,
      password: hashedPassword,
      role: "customer",
      phone,
      fcm,
    });

    const token = generateToken(user.id);

    user.token = token;

    await user.save();

    return res.status(200).json({
      message: "signup process success",
      user: {
        id: user.id,
        name,
        address,
        email,
        role: "customer",
        phone,
        fcm,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  const { key, password } = req.body;

  try {
    let user = null;

    if (key.includes("@")) {
      user = await User.findOne({
        where: { email: key },
      });
    } else {
      user = await User.findOne({
        where: { phone: key },
      });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "user with this email or phone not exist" });
    }

    const isEqual = await bcrypt.compare(password, user.admin.password);

    if (!isEqual) {
      return res.status(401).json({ error: "password is not correct" });
    }

    const token = generateToken(user.id);

    user.token = token;

    if (req.body.fcm) {
      user.fcm = req.body.fcm;
    }

    await user.save();

    return res.status(200).json({
      message: "login success",
      user: {
        id: user.id,
        name: user.name,
        fcm: user.fcm,
        email: user.email,
        phone: user.phone,
        token,
        role: "customer",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserByToken = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: { token },
    });

    if (!user) {
      return res.status(404).json({ message: "notfound" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: { token },
    });

    if (!user) {
      return res.status(404).json({ message: "notfound" });
    }

    // Check if email or phone exists and belongs to someone else
    const { email, phone } = req.body;
    if (
      email &&
      email !== user.email &&
      (await User.findOne({ where: { email } }))
    ) {
      return res.status(400).json({ message: "email already exist" });
    }
    if (
      phone &&
      phone !== user.phone &&
      (await User.findOne({ where: { phone } }))
    ) {
      return res.status(400).json({ message: "phone number already exist" });
    }

    const updatedUser = await user.update(req.body);

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { old_password, new_password, confirm_password } = req.body;

  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: { token },
    });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const isEqual = await bcrypt.compare(old_password, user.password);

    if (!isEqual) {
      res.status(401).json({ error: "wrong password" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: "password not matched" });
    }
    const hashedPassword = await bcrypt.hash(new_password, 12);

    user.password = hashedPassword;

    await user.save();
    // send email with new password
    return res.status(200).json({ message: "password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  User.destroy({ where: { id } })
    .then(() => res.json({ message: "deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
