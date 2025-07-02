const Alert = require("../models/alert");
const Logger = require("../util/logger");

exports.editAlert = async (req, res) => {
  const { name } = req.body;

  try {
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
    });

    const alert = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "alert",
      },
    });
    return res.status(200).json({ app_status, alert });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "error" });
  }
};
