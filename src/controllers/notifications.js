const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const Logger = require("../util/logger");

const Notification = require("../models/notifications");
const User = require("../models/user");
const { Op } = require("sequelize");
const serviceAccount = require("../talabatek-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendNotification = async (req, res) => {
  const { title, description, topic, fcm } = req.body;

  try {
    const messaging = admin.messaging();

    const result = await messaging.send({
      notification: {
        title,
        body: description,
      },
      token: fcm,
    });

    return res.status(200).json({ message: "success", result });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getUserNotification = async (req, res) => {
  const { size, page } = req.query;
  try {
    const limit = Number.parseInt(size);
    const offset = (Number.parseInt(page) - 1) * limit;

    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: {
        token: token,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const notifications = await Notification.findAll({
      limit: limit,
      offset: offset,
      where: {
        userId: user.id,
      },
      order: [["createdAt", "DESC"]],
    });

    const count = await Notification.count({
      where: { userId: user.id },
    }); // Get total number of products
    const notSeen = await Notification.count({
      where: { seen: false, userId: user.id },
    }); // Get total number of products
    const numOfPages = Math.ceil(count / limit); // Calculate number of pages

    return res
      .status(200)
      .json({ count, notSeen, numOfPages, results: notifications });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "Invalid token" });
  }
};
exports.updateNotification = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    if (!decodedToken.userId) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    await Notification.update(
      { seen: true },
      {
        where: {
          userId: decodedToken.userId,
        },
      }
    );
    return res.status(200).json({ message: "success" });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "Invalid token" });
  }
};
