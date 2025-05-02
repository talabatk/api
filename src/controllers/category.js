const Category = require("../models/category");
const Sequelize = require("sequelize");
const Product = require("../models/product");
const ProductImage = require("../models/productImage");
const Vendor = require("../models/vendor");
const User = require("../models/user");
const Logger = require("../util/logger");
const Area = require("../models/area");

exports.createCategory = async (req, res, next) => {
  const { name, order } = req.body;

  try {
    const maxOrder = await Category.max("order");
    const category = await Category.create({
      name,
      order: order ? order : +maxOrder + 1,
      image: req.files.image ? req.files.image[0].location : null,
    });

    return res.status(201).json({ message: "Category created!", category });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  Category.findAll({
    attributes: [
      "id",
      "order",
      "name",
      "image",
      // [Sequelize.literal(`CONCAT("https://${req.get("host")}/uploads/", image)`), "image"]
    ],
    order: [["order"]],
  })
    .then((categories) => {
      return res.status(200).json({ results: categories });
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.getOne = async (req, res) => {
  const { id } = req.params;

  Category.findByPk(id)
    .then((category) =>
      res.json({
        ...category.toJSON(),
        image: category.image ? category.image : null,
      })
    )
    .catch((error) => res.status(400).json({ error }));
};

exports.editOne = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findByPk(id);

    await category.update(req.body);

    if (req.files.image) {
      await category.update({
        image: req.files.image[0].location,
      });
    }

    return res.status(200).json({
      ...category.toJSON(),
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getOneWithVendors = async (req, res) => {
  const { id } = req.params;

  try {
    const vendors = await User.findAll({
      attributes: ["id", "name", "image"],
      include: [
        {
          model: Product,
          where: {
            categoryId: id,
          },
          include: [
            {
              model: ProductImage,
              attributes: ["id", "image"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({ count: vendors.length, results: vendors });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getCategoryWithVendors = async (req, res) => {
  const { id } = req.params;

  try {
    const vendors = await User.findAll({
      attributes: ["id", "name", "image", "email", "phone", "address", "fcm"], // Exclude product attributes from results
      where: {
        active: true,
      },
      include: [
        {
          model: Product,
          attributes: [], // Exclude product attributes from results
          where: {
            categoryId: id,
          },
        },
        {
          model: Vendor,
        },
        Area,
      ],
    });

    const results = vendors.map((user) => {
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

    return res.status(200).json({ count: vendors.length, results });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res, next) => {
  const { id } = req.params;

  Category.destroy({ where: { id } })
    .then(() => res.json({ message: "Category deleted" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.getVendorCategories = async (req, res) => {
  const { vendorId } = req.query;

  try {
    let filter = {};

    if (vendorId) {
      filter = { vendorId };
    }

    const categories = await Category.findAll({
      attributes: ["id", "name", "order", "image"],
      include: [
        {
          model: Product,
          include: [
            {
              model: ProductImage,
              attributes: ["id", "image"],
            },
            {
              model: User,
              attributes: ["id"],
              include: Vendor,
            },
          ],
          where: filter,
          //   limit: 6,
        },
      ],
      order: [["order"]],
    });

    return res.status(200).json({ results: categories });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
