const Admin = require("../models/admin");
const Area = require("../models/area");
const City = require("../models/city");
const User = require("../models/user");
const Logger = require("../util/logger");

exports.createArea = async (req, res, next) => {
  const { name, cityId } = req.body;

  try {
    const area = await Area.create({
      name,
      cityId,
    });

    return res.status(201).json({ message: "area created!", area });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  let { cityId } = req.query;

  const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

  const user = await User.findOne({
    where: { token },
    include: [{ model: Admin }],
    attributes: { exclude: ["password"] },
  });
  if (user.admin && !user.admin.super_admin) {
    cityId = user.cityId;
  }

  Area.findAll({
    where: cityId
      ? {
          cityId,
        }
      : {},
    include: [City],
  })
    .then((areas) => {
      return res.status(200).json({ results: areas });
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.getOne = async (req, res) => {
  const { id } = req.params;

  Area.findByPk(id)
    .then((area) => res.json(area))
    .catch((error) => res.status(400).json({ error }));
};

exports.editOne = async (req, res) => {
  const { id } = req.params;

  try {
    const area = await Area.findByPk(id);

    await area.update(req.body);

    return res.status(200).json(area);
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res, next) => {
  const { id } = req.params;

  Area.destroy({ where: { id } })
    .then(() => res.json({ message: "area deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
