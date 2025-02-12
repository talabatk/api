const User = require("../models/user");
const Logger = require("../util/logger");

const { io } = require("../app");
const Message = require("../models/messages");

exports.sendMessageFromUser = async (req, res) => {
  const { message } = req.body;
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: {
        token: token,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const newMessage = await Message.create({
      message: message,
      userId: user.id,
    });

    io.to("admins").emit("new-message", newMessage);
    return res.status(201).json({ status: "success", message: newMessage });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.sendMessageToUser = async (req, res) => {
  const { message, userId } = req.body;
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: {
        token: token,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const newMessage = await Message.create({
      message: message,
      userId,
    });

    io.to(`${userId}`).emit("new-message", newMessage);

    return res.status(201).json({ status: "success", message: newMessage });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getUserMessages = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: {
        token: token,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const messages = await Message.findAll({
      where: {
        userId: user.id,
      },
    });

    return res.status(200).json({ status: "success", results: messages });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
