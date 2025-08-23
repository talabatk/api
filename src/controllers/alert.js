const Alert = require("../models/alert");
const City = require("../models/city");
const CityAlerts = require("../models/cityAlerts");
const Logger = require("../util/logger");

exports.editAlert = async (req, res) => {
  const { name } = req.body;

  try {
    const alert = await Alert.findOne({
      where: {
        name,
      },
    });

    await CityAlerts.destroy({
      where: {
        alertId: alert.id,
      },
    });

    req.body.cities?.forEach(async (c) => {
      await CityAlerts.create({
        alertId: alert.id,
        cityId: +c,
      });
    });

    if (name === "banner") {
      const data = await Alert.update(
        {
          content: req.body.content,
          discription: req.body.discription,
          status: req.body.status,
          image: req.files.image ? req.files.image[0].location : undefined,
        },
        {
          where: {
            name,
          },
        }
      );

      return res.status(200).json({ data });
    }

    const data = await Alert.update(req.body, {
      where: {
        name,
      },
    });

    return res.status(200).json({ data });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const app_status = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "app_status",
      },
      include: [City],
    });

    const alert = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "alert",
      },
      include: [City],
    });

    const banner = await Alert.findOne({
      attributes: ["content", "status", "image", "discription"],
      where: {
        name: "banner",
      },
      include: [City],
    });

    return res.status(200).json({ app_status, alert, banner });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "error" });
  }
};
