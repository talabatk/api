const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

const Notification = require("../models/notifications");
const User = require("../models/user");
const UserNotification = require("../models/userNotification");
const { Op } = require("sequelize");
const serviceAccount = require("../talabatek-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendNotification = async (req, res) => {
  const message = req.body.message;
  const tokens = req.body.tokens;

  const notification = await Notification.create({
    title: message.notification.title,
    description: message.notification.body,
    topic: message.topic,
  });

  if (message.topic === "selected") {
    const users = await User.findAll({
      attributes: ["id"],
      where: {
        fcm: {
          [Op.in]: tokens,
        },
      },
    });

    let userNotifications = [];

    users.forEach((user) => {
      userNotifications.push({
        userId: user.id,
        notificationId: notification.id,
      });
    });
    console.log(userNotifications);
    const results = await UserNotification.bulkCreate(userNotifications);
  }

  admin
    .messaging()
    .send(message)
    .then(function (response) {
      return res.status(200).json({ message: "success", response });
    })
    .catch(function (error) {
      res.status(400).json(error);
    });
};

exports.sentNotificationToUser = async (req, res) => {
  const title = req.body.title;
  const body = req.body.body;
  const token = req.body.fcm;

  const message = {
    token: token,
    notification: {
      title,
      body,
    },
  };

  admin
    .messaging()
    .send(message)
    .then(function (response) {
      return res.status(200).json({ message: "success", response });
    })
    .catch(function (error) {
      res.status(400).json(error);
    });
};

exports.unsubscribe = async (req, res) => {
  const data = req.body;
  admin
    .messaging()
    .unsubscribeFromTopic(data.tokens, data.topic)
    .then((response) => {
      return res.json(response);
    })
    .catch((error) => res.json(error));
};

exports.subscribe = async (req, res) => {
  const data = req.body;
  admin
    .messaging()
    .subscribeToTopic(data.tokens, data.topic)
    .then((response) => {
      console.log(response);
      return res.json(response);
    })
    .catch((error) => {
      console.log(error);
      res.json(error);
    });
};

exports.getUserNotification = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    if (!decodedToken.userId) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const notifications = await Notification.findAll({
      where: {
        userId: decodedToken.userId,
      },
      order: [["createdAt", "DESC"]],
    });

    await Notification.update(
      { seen: true },
      {
        where: {
          userId: decodedToken.userId,
        },
      }
    );

    return res.status(200).json({ results: notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Invalid token" });
  }
};
