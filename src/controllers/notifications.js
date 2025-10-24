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
  const { title, description, topic, fcm, userId } = req.body;

  try {
    const messaging = admin.messaging();

    let result = null;
    if (topic) {
      result = await messaging.send({
        notification: {
          title,
          body: description,
        },
        topic: topic,
      });
      await Notification.create({
        topic,
        title,
        description,
      });
    } else {
      result = await messaging.send({
        notification: {
          title,
          body: description,
        },
        token: fcm,
      });
      await Notification.create({
        userId,
        title,
        description,
      });
    }

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
    let notifications = null;
    if (page) {
      notifications = await Notification.findAll({
        limit: limit,
        offset: offset,
        where: {
          [Op.or]: [
            { userId: user.id },
            {
              topic: {
                [Op.in]: [
                  "all",
                  user.role === "vendor" ? "restaurant" : user.role,
                ],
              },
            },
          ],
        },
        order: [["createdAt", "DESC"]],
      });
    } else {
      notifications = await Notification.findAll({
        where: {
          [Op.or]: [
            { userId: user.id },
            {
              topic: {
                [Op.in]: [
                  "all",
                  user.role === "vendor" ? "restaurant" : user.role,
                ],
              },
            },
          ],
        },
        order: [["createdAt", "DESC"]],
      });
    }

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
// Function to get FCM tokens of all admins

async function getAdminFCMTokens() {
  try {
    const admins = await User.findAll({
      attributes: ["fcm"], // assuming fcmToken is stored in the Admin model
      where: {
        role: "admin",
      },
    });
    return admins.map((admin) => admin.fcm);
  } catch (error) {
    console.error("Error fetching admin FCM tokens:", error);
    return [];
  }
}

exports.subscribeAdminsToTopic = async () => {
  try {
    const fcmTokens = await getAdminFCMTokens(); // Fetch FCM tokens of admins

    if (fcmTokens.length === 0) {
      console.log("No admin FCM tokens found");
      return;
    }

    // Subscribe FCM tokens to 'admin' topic
    const response = await admin
      .messaging()
      .subscribeToTopic(fcmTokens, "admin");

    console.log("Successfully subscribed to topic:", response);
  } catch (error) {
    console.error("Error subscribing to topic:", error);
  }
};
