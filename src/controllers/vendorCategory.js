const Logger = require("../util/logger");
const VendorCategory = require("../models/VendorCategory");
const Vendor = require("../models/vendor");
const User = require("../models/user");
const Alert = require("../models/alert");
const Area = require("../models/area");

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
  try {
    let categories = await VendorCategory.findAll({
      attributes: ["id", "order", "name", "image"],
      include: [
        {
          model: Vendor,
          include: {
            model: User,
            include: [Area],
          },
        },
      ],
      order: [["order"]],
    });

    categories = categories.map((category) => {
      const vendors = category.vendors.map((vendor) => {
        return {
          id: vendor.user.id,
          status: vendor.status,
          name: vendor.user.name,
          image: vendor.user.image,
          email: vendor.user.email,
          phone: vendor.user.phone,
          address: vendor.user.address,
          fcm: vendor.user.fcm,
          role: "vendor",
          description: vendor.description,
          direction: vendor.direction,
          distance: vendor.distance,
          delivery_time: vendor.delivery_time,
          free_delivery_limit: vendor.free_delivery_limit,
          cover: vendor.cover,
          areas: vendor.user.areas,
        };
      });
      return {
        ...category.toJSON(),
        vendors,
      };
    });
    const app_status = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "app_status",
      },
    });

    const alert = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "alert",
      },
    });
    return res.status(200).json({ results: categories, app_status, alert });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "error" });
  }
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
