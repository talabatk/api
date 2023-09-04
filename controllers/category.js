const Category = require("../models/category");
const Sequelize = require("sequelize");
const VendorCategory = require("../models/vendorCategories");
const { Op } = require("sequelize");
const Product = require("../models/product");
const ProductImage = require("../models/productImage");

exports.createCategory = async (req, res, next) => {
  const { name, order } = req.body;

  try {
    const maxOrder = await Category.max("order");
    const category = await Category.create({
      name,
      order: order ? order : +maxOrder + 1,
      image: req.files.image ? req.files.image[0].filename : null,
    });

    category.image = "http://" + req.get("host") + "/uploads/" + category.image;

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
      [
        Sequelize.literal(
          `CONCAT("https://${req.get("host")}/uploads/", image)`
        ),
        "image",
      ],
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
        image: category.image
          ? "https://" + req.get("host") + "/uploads/" + category.image
          : null,
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
        image: req.files.image[0].filename,
      });
    }

    return res.status(200).json({
      ...category.toJSON(),
      image: category.image
        ? "http://" + req.get("host") + "/uploads/" + category.image
        : null,
    });
  } catch (error) {
    console.log(error);
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
      attributes: [
        "id",
        "name",
        "order",
        [
          Sequelize.literal(
            `CONCAT("https://${req.get("host")}/uploads/", category.image)`
          ),
          "image",
        ],
      ],
      include: [
        {
          model: Product,
          include: [
            {
              model: ProductImage,
              attributes: [
                "id",
                [
                  Sequelize.literal(
                    `CONCAT("https://${req.get(
                      "host"
                    )}/uploads/",\`products->productImages\`.\`image\`)`
                  ),
                  "image",
                ],
              ],
            },
          ],
          where: filter,
        },
      ],
      order: [["order"]],
    });

    return res.status(200).json({ results: categories });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
