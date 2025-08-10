const Slider = require("../models/adsBanner");
const User = require("../models/user");
const Logger = require("../util/logger");

exports.createSlider = async (req, res) => {
  const { title, discription, status } = req.body;

  try {
    const slider = await Slider.create({
      title,
      discription,
      status,
      image: req.files.image[0].location,
    });
    return res.status(201).json({ message: "slider created", slider });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const sliders = await Slider.findAll();

    const results = sliders.map((slider) => {
      return {
        ...slider.toJSON(),
        image: slider.image ? slider.image : null,
      };
    });

    return res.status(201).json({ results: results });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.editOne = async (req, res) => {
  const { id } = req.params;
  try {
    const slider = await Slider.findByPk(id);

    if (req.files.image) {
      slider.image = req.files.image[0].location;
    }

    if (req.body.title) {
      slider.title = req.body.title;
    }

    if (req.body.discription) {
      slider.discription = req.body.discription;
    }
    await slider.save();

    return res.status(201).json({ message: "updated successfully", slider });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res) => {
  const { id } = req.params;

  Slider.destroy({ where: { id } })
    .then(() => res.json({ message: "deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
