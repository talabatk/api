const GeneralOption = require("../models/generalOption");
const Logger = require("../util/logger");

exports.createGeneralOption = async (req, res, next) => {
  const { name } = req.body;

  try {
    const option = await GeneralOption.create({
      name,
      image: req.files[0] ? req.files[0].location : null,
    });

    return res.status(201).json({ message: "GeneralOption created!", option });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  const { size, page, type } = req.query;
  try {
    let options = null;
    if (page) {
      const limit = size ? Number.parseInt(size) : 1000;
      const offset = size ? (Number.parseInt(page) - 1) * limit : 1000;
      options = await GeneralOption.findAll({
        limit: limit,
        offset: offset,
        where: type
          ? {
              type: type,
            }
          : {},
        attributes: ["id", "name", "image"],
      });
      const count = await GeneralOption.count({
        where: type
          ? {
              type: type,
            }
          : {},
      }); // Get total number of products

      const numOfPages = Math.ceil(count / limit); // Calculate number of pages

      return res.status(200).json({
        count,
        pages: numOfPages,
        results: options,
      });
    } else {
      options = await GeneralOption.findAll({
        where: type
          ? {
              type: type,
            }
          : {},
        attributes: ["id", "name", "image"],
      });

      return res.status(200).json({
        results: options,
      });
    }
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;

  GeneralOption.findByPk(id)
    .then((GeneralOption) =>
      res.json({
        ...GeneralOption.toJSON(),
        image: GeneralOption.image ? GeneralOption.image : null,
      })
    )
    .catch((error) => res.status(400).json({ error }));
};

exports.editOne = async (req, res) => {
  const { id } = req.params;

  try {
    const option = await GeneralOption.findByPk(id);

    await option.update(req.body);

    if (req.files[0]) {
      await option.update({
        image: req.files[0].location,
      });
    }

    return res.status(200).json({
      ...option.toJSON(),
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res, next) => {
  const { id } = req.params;

  GeneralOption.destroy({ where: { id } })
    .then(() => res.json({ message: "GeneralOption deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
