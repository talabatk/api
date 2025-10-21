const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//models===============================
const User = require("../models/user");
const Admin = require("../models/admin");
const AdminRole = require("../models/adminRole");
const Vendor = require("../models/vendor");
const Area = require("../models/area");
const Logger = require("../util/logger");
const VendorCategory = require("../models/VendorCategory");
const VendorCategories = require("../models/VendorCategories");
const City = require("../models/city");

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
    categories,
    type,
    cityId,
  } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ message: "passwords not matched" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const cover = req.files.find((file) => file.fieldname === "cover");
    const image = req.files.find((file) => file.fieldname === "image");

    const user = await User.create({
      name,
      email,
      phone,
      fcm,
      address,
      image: image ? image.location : null,
      role: "vendor",
      password: hashedPassword,
      cityId,
    });
    const vendor = await Vendor.create({
      description,
      userId: user.id,
      cover: cover ? cover.location : null,
      status,
      free_delivery_limit,
      delivery_time,
      direction,
      distance,
      type,
    });

    if (categories) {
      categories.forEach(async (category) => {
        await VendorCategories.create({
          vendorId: vendor.id,
          vendorCategoryId: category,
        });
      });
    }

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
  let { cityId } = req.query;
  const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

  const user = await User.findOne({
    where: { token },
    include: [{ model: Admin }, AdminRole],
    attributes: { exclude: ["password"] },
  });

  if (user && user?.admin && !user.admin?.super_admin) {
    cityId = user.cityId;
  }

  try {
    const filters = {};
    filters.role = "vendor";
    filters.active = true;

    if (cityId) {
      filters.cityId = cityId;
    }

    const users = await User.findAll({
      where: filters,
      include: [{ model: Vendor, include: [VendorCategory] }, Area, City],
      attributes: { exclude: ["password"] },
    });

    const count = await User.count({
      where: filters,
    }); // Get total number of admins

    const results = users.map((user) => {
      const { id, name, email, phone, address, fcm } = user;

      return {
        id,
        name,
        email,
        phone,
        address,
        city: user.city,
        cityId: user.cityId,
        status: user.vendor ? user.vendor?.status : "opened",
        fcm,
        role: "vendor",
        description: user.vendor.description,
        direction: user.vendor.direction,
        distance: user.vendor.distance,
        type: user.vendor.type,
        delivery_time: user.vendor.delivery_time,
        free_delivery_limit: user.vendor.free_delivery_limit,
        image: user.image,
        cover: user.vendor.cover,
        areas: user.areas,
        vendorCategories: user.vendor.vendor_categories,
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
      include: [{ model: Vendor, include: [VendorCategory] }, Area, City],
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
        city: user.city,
        fcm,
        role: "vendor",
        description: user.vendor.description,
        direction: user.vendor.direction,
        distance: user.vendor.distance,
        delivery_time: user.vendor.delivery_time,
        type: user.vendor.type,
        free_delivery_limit: user.vendor.free_delivery_limit,
        image: user.image,
        cover: user.vendor.cover,
        areas: user.areas,
        vendorCategories: user.vendor.vendor_categories,
      };
    });

    return res.status(200).json({ results: results[0] });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.editVendor = async (req, res) => {
  const { id, password, confirm_password, categories } = req.body;

  try {
    let vendor = null;
    const cover = req.files.find((file) => file.fieldname === "cover");
    const image = req.files.find((file) => file.fieldname === "image");
    if (id) {
      vendor = await User.findByPk(id, {
        include: [Vendor, Area],
      });
    } else {
      vendor = await User.findOne({
        where: { token },
        include: [Vendor, Area],
      });
    }

    if (!vendor) {
      return res.status(404).json({ message: "notfound" });
    }
    if (password) {
      if (password !== confirm_password) {
        return res.status(400).json({ error: "password not matched" });
      }
      const hashedPassword = await bcrypt.hash(password, 12);

      vendor.password = hashedPassword;

      req.body.password = hashedPassword;
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

    if (image) {
      await vendor.update({
        image: image.location,
      });
    }

    if (cover) {
      await vendor.vendor.update({ cover: cover.location });
    }

    if (categories) {
      await VendorCategories.destroy({ where: { vendorId: vendor.vendor.id } });
      categories.forEach(async (category) => {
        await VendorCategories.create({
          vendorId: vendor.vendor.id,
          vendorCategoryId: category,
        });
      });
    }

    await vendor.vendor.update(req.body);

    return res.status(200).json(updatedVendor);
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
