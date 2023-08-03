const Category = require("../models/category");

exports.createCategory = async (req, res, next) => {
  const { name } = req.body;

  try {
    const category = await Category.create({
      name,
      image: req.file ? req.file.filename : null,
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
  Category.findAll()
    .then((categories) => {
      const categoriesWithUrls = categories.map((item) => ({
        name: item.name,
        image: item.image
          ? "http://" + req.get("host") + "/uploads/" + item.image
          : null,
      }));
      return res.status(200).json({ results: categoriesWithUrls });
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
          ? "http://" + req.get("host") + "/uploads/" + category.image
          : null,
      })
    )
    .catch((error) => res.status(400).json({ error }));
};

exports.editOne = async (req, res) => {
  const { id } = req.params;

  Category.update(req.body, { where: { id } })
    .then(() => {
      if (req.file) {
        Category.update({ image: req.file.filename }, { where: { id } });
      }
    })
    .then(() => Category.findByPk(id))
    .then((category) =>
      res.json({
        ...category.toJSON(),
        image: category.image
          ? "http://" + req.get("host") + "/uploads/" + category.image
          : null,
      })
    )
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteOne = async (req, res, next) => {
  const { id } = req.params;

  Category.destroy({ where: { id } })
    .then(() => res.json({ message: "Category deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
