const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//models===============================
const User = require("../models/user");
const Vendor = require("../models/vendor");
const DeliveryCost = require("../models/delivery_cost");
const Area = require("../models/area");

//generate token=======================
const generateToken = (userId) => {
  const token = jwt.sign({ userId }, "talabatek2309288/k_ss-jdls88", {
    expiresIn: "5400h",
  });
  return token;
};

exports.login = async (req, res) => {
  const { key, password } = req.body;

  try {
    let user = null;

    if (key.includes("@")) {
      user = await User.findOne({
        where: { email: key, role: "vendor" },
        include: [Vendor, Area],
      });
    } else {
      user = await User.findOne({
        where: { phone: key, role: "vendor" },
        include: [Vendor],
      });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "user with this email not exist" });
    }

    if (!user.vendor) {
      return res.status(401).json({ error: "you are not vendor" });
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
        role: user.role,
        description: user.vendor.description,
        open: user.vendor.open,
        direction: user.vendor.direction,
        distance: user.vendor.distance,
        delivery_time: user.vendor.delivery_time,
        image: user.image
          ? "http://" + req.get("host") + "/uploads/" + user.image
          : null,
        cover: user.vendor.cover
          ? "http://" + req.get("host") + "/uploads/" + user.cover
          : null,
        token,
        areas: user.areas,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.createVendor = async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    fcm,
    password,
    confirm_password,
    open,
    description,
    delivery_time,
    direction,
    distance,
  } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ error: "passwords not matched" });
  }

  try {
    console.log(req.files);
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      phone,
      fcm,
      address,
      image: req.files.image[0] ? req.files.image[0].filename : null,
      role: "vendor",
      password: hashedPassword,
    });

    const vendor = await Vendor.create({
      description,
      userId: user.id,
      cover: req.files.cover[0] ? req.files.cover[0].filename : null,
      open,
      delivery_time,
      direction,
      distance,
    });

    const token = generateToken(user.id);

    user.token = token;

    await user.save();

    return res.status(201).json({
      message: "vendor created",
      user: {
        id: user.id,
        name,
        email,
        address,
        phone,
        description,
        image: req.files.image[0]
          ? "http://" +
            req.get("host") +
            "/uploads/" +
            req.files.image[0].filename
          : null,
        cover: req.files.cover[0]
          ? "http://" +
            req.get("host") +
            "/uploads/" +
            req.files.cover[0].filename
          : null,
        fcm,
        token,
        open,
        direction,
        distance,
        delivery_time,
        role: "vendor",
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAllVendors = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: "vendor",
      },
      include: [Vendor, Area],
      attributes: { exclude: ["password"] },
    });

    const count = await User.count({
      where: {
        role: "vendor",
      },
    }); // Get total number of admins

    const results = users.map((user) => {
      if (user.image) {
        user.image = "http://" + req.get("host") + "/uploads/" + user.image;
      }
      if (user.vendor.cover) {
        user.vendor.cover =
          "http://" + req.get("host") + "/uploads/" + user.vendor.cover;
      }
      const { id, name, email, phone, address, fcm, open } = user;
      return {
        id,
        name,
        email,
        phone,
        address,
        open,
        fcm,
        role: "vendor",
        description: user.vendor.description,
        direction: user.vendor.direction,
        distance: user.vendor.distance,
        delivery_time: user.vendor.delivery_time,
        image: user.image,
        cover: user.vendor.cover,
        areas: user.areas,
      };
    });

    return res.status(200).json({ count: count, results: results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.editVendor = async (req, res) => {
  const { id } = req.body;

  try {
    let vendor = null;

    if (id) {
      vendor = await User.findByPk(id, {
        include: [Vendor],
      });
    } else {
      vendor = await User.findOne({
        where: { token },
        include: [Vendor],
      });
    }

    if (!vendor) {
      return res.status(404).json({ message: "notfound" });
    }

    // Check if email or phone exists and belongs to someone else
    const { email, phone } = req.body;
    if (
      email &&
      email !== vendor.email &&
      (await User.findOne({ where: { email } }))
    ) {
      return res.status(400).json({ message: "email already exist" });
    }
    if (
      phone &&
      phone !== vendor.phone &&
      (await User.findOne({ where: { phone } }))
    ) {
      return res.status(400).json({ message: "phone number already exist" });
    }

    const updatedVendor = await vendor.update(req.body);

    if (req.files.image) {
      const updateUser = await vendor.update({
        image: req.files.image[0].filename,
      });

      updatedVendor.image =
        "http://" + req.get("host") + "/uploads/" + updatedVendor.image;
    }

    if (req.files.cover) {
      await vendor.vendor.update({ cover: req.files.cover[0].filename });

      updatedVendor.vendor.cover =
        "http://" + req.get("host") + "/uploads/" + req.files.cover[0].filename;
    }

    await vendor.vendor.update(req.body);

    return res.status(200).json(updatedVendor);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
