const Slider = require("../models/slider");

exports.createSlider = async (req, res) => {
  const { title, productId, vendorId } = req.body;

  try {
    const slider = await Slider.create({
      title,
      productId,
      vendorId,
      image: req.file.filename,
    });
    return res.status(201).json({ message: "slider created", slider });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const sliders = await Slider.findAll();

    const results = sliders.map((slider) => {
      return {
        ...slider.toJSON(),
        image: "http://" + req.get("host") + "/uploads/" + slider.image,
      };
    });

    return res.status(201).json({ results: results });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.editOne = async (req, res) => {
  const { id } = req.params;
  try {
    const slider = await Slider.findByPk(id);

    if (req.file) {
      slider.image = req.file.filename;
    }

    if (req.body.title) {
      slider.title = req.body.title;
    }

    if (req.body.productId) {
      slider.productId = req.body.productId;
    }

    if (req.body.productId === "none") {
      slider.productId = null;
    }

    if (req.body.vendorId) {
      slider.vendorId = req.body.vendorId;
    }

    if (req.body.vendorId === "none") {
      slider.vendorId = null;
    }

    await slider.save();

    return res.status(201).json({ message: "updated successfully", slider });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res) => {
  const { id } = req.params;

  Slider.destroy({ where: { id } })
    .then(() => res.json({ message: "deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
