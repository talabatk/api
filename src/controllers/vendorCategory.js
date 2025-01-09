const Logger = require("../util/logger");
const VendorCategory = require("../models/VendorCategory");
const Vendor = require("../models/vendor");
const User = require("../models/user");

exports.createVendorCategory = async (req, res, next) => {
  const { name, order } = req.body;

  try {
    const maxOrder = await VendorCategory.max("order");
    const vendorCategory = await VendorCategory.create({
      name,
      order: order ? order : +maxOrder + 1,
      image: req.files.image ? req.files.image[0].location : null,
    });

    return res
      .status(201)
      .json({ message: "Vendor Category created!", vendorCategory });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  VendorCategory.findAll({
    attributes: ["id", "order", "name", "image"],
    include: [
      {
        model: Vendor,
        attributes: ["id", "status"],
        include: { model: User, attributes: ["id", "name", "image"] },
      },
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

  VendorCategory.findByPk(id, {
    include: [
      {
        model: Vendor,
        attributes: ["id", "status"],
        include: { model: User, attributes: ["id", "name", "image"] },
      },
    ],
  })
    .then((VendorCategory) =>
      res.json({
        ...VendorCategory.toJSON(),
        image: VendorCategory.image ? VendorCategory.image : null,
      })
    )
    .catch((error) => res.status(400).json({ error }));
};

exports.editOne = async (req, res) => {
  const { id } = req.params;

  try {
    const vendorCategory = await VendorCategory.findByPk(id);

    await vendorCategory.update(req.body);

    if (req.files.image) {
      await vendorCategory.update({
        image: req.files.image[0].location,
      });
    }

    return res.status(200).json({
      ...vendorCategory.toJSON(),
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res, next) => {
  const { id } = req.params;

  VendorCategory.destroy({ where: { id } })
    .then(() => res.json({ message: "VendorCategory deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
