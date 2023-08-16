const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
//models===================
const User = require("../models/user");
const Vendor = require("../models/vendor");
const Admin = require("../models/admin");
const AdminRole = require("../models/adminRole");

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
      image: req.files.image[0] ? req.files.image[0].filename : null,
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
        image: req.files.image
          ? "http://" +
            req.get("host") +
            "/uploads/" +
            req.files.image[0].filename
          : null,
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

    const isEqual = await bcrypt.compare(password, user.password);

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
        address: user.address,
        image: user.image
          ? "http://" + req.get("host") + "/uploads/" + user.image
          : null,
        token,
        role: "customer",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.smsLogin = async (req, res) => {
  const { phone, fcm } = req.body;

  try {
    const [user, created] = await User.findOrCreate({
      where: { phone },
      defaults: {
        name: phone,
        phone,
        role: "customer",
        fcm,
      },
      attributes: ["id", "name", "role", "fcm", "phone", "token"],
    });

    const token = generateToken(user.id);

    user.token = token;

    await user.save();

    return res.status(200).json({
      message: "success",
      user,
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
      include: [Vendor, { model: Admin, include: AdminRole }],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "notfound" });
    }

    const { id, name, email, phone, address, fcm } = user;

    if (user.vendor) {
      return res.status(200).json({
        id,
        name,
        email,
        phone,
        address,
        fcm,
        role: "vendor",
        description: user.vendor.description,
        image: user.image
          ? "http://" + req.get("host") + "/uploads/" + user.image
          : null,
        open: user.vendor.open,
      });
    }

    if (user.admin) {
      return res.status(200).json({
        id,
        name,
        email,
        phone,
        fcm,
        role: "admin",
        super_admin: user.admin.super_admin,
        image: user.image
          ? "http://" + req.get("host") + "/uploads/" + user.image
          : null,
      });
    }
    return res.status(200).json({
      id,
      name,
      email,
      address,
      phone,
      fcm,
      role: user.role,
      image: user.image
        ? "http://" + req.get("host") + "/uploads/" + user.image
        : null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  const { id } = req.body;

  try {
    let user = null;

    if (id) {
      user = await User.findByPk(id);
    } else {
      const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header
      user = await User.findOne({
        where: { token },
      });
    }

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

    if (req.files.image) {
      const updateUser = await user.update({
        image: req.files.image[0].filename,
      });

      updatedUser.image =
        "http://" + req.get("host") + "/uploads/" + updatedUser.image;
    }

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
      return res.status(401).json({ error: "wrong password" });
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
