const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//models===============================
const User = require("../models/user");
const Vendor = require("../models/vendor");
const Area = require("../models/area");
const Logger = require("../util/logger");

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

    if (req.body.fcm) {
      user.fcm = req.body.fcm;
    }

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
        status: user.vendor.status,
        direction: user.vendor.direction,
        distance: user.vendor.distance,
        delivery_time: user.vendor.delivery_time,
        free_delivery_limit: user.vendor.free_delivery_limit,
        image: user.image ? user.image : null,
        cover: user.vendor.cover ? user.vendor.cover : null,
        token,
        areas: user.areas,
      },
    });
  } catch (error) {
    Logger.error(error);
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
    status,
    description,
    delivery_time,
    free_delivery_limit,
    direction,
    distance,
  } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ error: "passwords not matched" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      phone,
      fcm,
      address,
      image: req.files.image ? req.files.image[0].location : null,
      role: "vendor",
      password: hashedPassword,
    });

    const vendor = await Vendor.create({
      description,
      userId: user.id,
      cover: req.files.cover ? req.files.cover[0].location : null,
      status,
      free_delivery_limit,
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
        image: user.image ? user.image : null,
        cover: vendor.cover ? vendor.cover : null,
        fcm,
        token,
        status,
        direction,
        distance,
        free_delivery_limit,
        delivery_time,
        role: "vendor",
      },
    });
  } catch (error) {
    Logger.error(error);
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
      const { id, name, email, phone, address, fcm } = user;

      return {
        id,
        name,
        email,
        phone,
        address,
        status: user.vendor.status,
        fcm,
        role: "vendor",
        description: user.vendor.description,
        direction: user.vendor.direction,
        distance: user.vendor.distance,
        delivery_time: user.vendor.delivery_time,
        free_delivery_limit: user.vendor.free_delivery_limit,
        image: user.image,
        cover: user.vendor.cover,
        areas: user.areas,
      };
    });

    return res.status(200).json({ count: count, results: results });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getVendor = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: "vendor",
        id: req.params.id,
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
      const { id, name, email, phone, address, fcm } = user;

      return {
        id,
        name,
        email,
        phone,
        address,
        status: user.vendor.status,
        fcm,
        role: "vendor",
        description: user.vendor.description,
        direction: user.vendor.direction,
        distance: user.vendor.distance,
        delivery_time: user.vendor.delivery_time,
        free_delivery_limit: user.vendor.free_delivery_limit,
        image: user.image,
        cover: user.vendor.cover,
        areas: user.areas,
      };
    });

    return res.status(200).json({ result: results[0] });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.editVendor = async (req, res) => {
  const { id } = req.body;

  try {
    let vendor = null;

    if (id) {
      vendor = await User.findByPk(id, {
        include: [Vendor, Area],
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
    const { phone } = req.body;
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
        image: req.files.image[0].location,
      });
    }

    if (req.files.cover) {
      await vendor.vendor.update({ cover: req.files.cover[0].location });
    }

    await vendor.vendor.update(req.body);

    return res.status(200).json(updatedVendor);
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
