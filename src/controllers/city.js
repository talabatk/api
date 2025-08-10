const City = require("../models/city");
const Logger = require("../util/logger");

exports.createCity = async (req, res, next) => {
  const { name, topic } = req.body;

  try {
    const city = await City.create({
      name,
      topic,
    });

    return res.status(201).json({ message: "city created!", city });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const cities = await City.findAll();

    return res.status(200).json({
      results: cities,
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;

  City.findByPk(id)
    .then((city) =>
      res.json({
        ...category.toJSON(),
      })
    )
    .catch((error) => res.status(400).json({ error }));
};

exports.editOne = async (req, res) => {
  const { id } = req.params;

  try {
    const city = await Category.findByPk(id);

    return res.status(200).json({
      ...city.toJSON(),
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res, next) => {
  const { id } = req.params;

  City.destroy({ where: { id } })
    .then(() => res.json({ message: "city deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
