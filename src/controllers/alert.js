const Alert = require("../models/alert");
const Logger = require("../util/logger");

exports.editAlert = async (req, res) => {
  const { name } = req.body;

  try {
    await Alert.update(req.body).where("name", name);

    return res.status(200).json(Alert);
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
