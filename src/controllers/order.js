const Area = require("../models/area");
const Cart = require("../models/cart");
const CartProduct = require("../models/cartProduct");
const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");
const Option = require("../models/option");
const { io } = require("../app");
const admin = require("firebase-admin");
const Notification = require("../models/notifications");
const { Op, Sequelize } = require("sequelize");
const DeliveryCost = require("../models/delivery_cost");
const Delivery = require("../models/delivery");
const Logger = require("../util/logger");

const vendorSockets = {};

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    Logger.info("User disconnected");

    // Remove disconnected vendor from vendorSockets
    for (const vendorId in vendorSockets) {
      if (vendorSockets[vendorId] === socket) {
        delete vendorSockets[vendorId];
        break;
      }
    }
  });

  socket.on("registerVendor", (vendorId) => {
    vendorSockets[vendorId] = socket;
  });
});

function getCurrentDateTimeInPalestine() {
  const date = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Gaza", // or 'Asia/Hebron'
    hour12: true,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return date;
}

const getVendorOrder = async (id) => {
  const order = await Order.findByPk(id, {
    attributes: [
      "id",
      "status",
      "name",
      "phone",
      "total",
      "shipping",
      "address",
      "createdAt",
      "notes",
    ],
    include: [
      {
        model: CartProduct,
        include: [
          {
            model: Product,
          },
          Option,
        ],
      },
      Area,
      { model: Delivery, include: User },
    ],
  });

  return order;
};

exports.createOrder = async (req, res) => {
  const { areaId, address, name, phone, location, notes } = req.body;

  try {
    let vendor = null;

    let shipping = 0;

    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const user = await User.findByPk(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (!user.active) {
      return res.status(400).json({ message: "تم ايقاف حسابك مؤقتا" });
    }

    const cart = await Cart.findOne({
      where: { userId: decodedToken.userId },
      include: [
        {
          model: CartProduct,
          include: [
            {
              model: Product,
              include: {
                model: User,
                attributes: ["id", "fcm"],
                include: [{ model: Area }, Vendor],
              },
            },
          ],
          where: { ordered: false },
        },
      ],
    });

    if (!cart) {
      return res.status(400).json({ message: "no items in cart" });
    }

    const area = cart.cart_products[0]?.product.user.areas.find(
      (item) => item.id === +areaId
    );

    if (!area) {
      return res
        .status(400)
        .json({ message: "المطعم لا يدعم التوصيل لهذه المنطقه" });
    }

    if (cart.cart_products[0]?.product.user.vendor.status !== "open") {
      return res.status(400).json({ message: "هذا المطعم مغلق حاليا!" });
    }
    // calculate shipping cost
    for (const e of cart.cart_products) {
      await Product.update(
        { orders: +e.product.orders + +e.quantity },
        { where: { id: e.product.id } }
      );

      if (
        vendor &&
        vendor?.userId &&
        +e.product.user.userId !== +vendor?.userId
      ) {
        return res
          .status(400)
          .json({ message: "لا يمكنك طلب طلبيه بأكثر من مطعم في نفس الطلبيه" });
      } else {
        vendor = e.product.user;
      }
    }

    if (+vendor.vendor.free_delivery_limit === 0) {
      shipping = +area.delivery_cost.cost;
    } else if (
      +vendor.vendor.free_delivery_limit !== 0 &&
      +vendor.vendor.free_delivery_limit > +cart.total
    ) {
      shipping = +area.delivery_cost.cost;
    }

    const currentDate = getCurrentDateTimeInPalestine();
    //save order
    const order = await Order.create({
      address,
      total_quantity: +cart.total_quantity,
      subtotal: +cart.total,
      shipping,
      name,
      phone,
      location,
      notes,
      total: shipping + +cart.total,
      userId: decodedToken.userId,
      areaId,
      updatedTime: currentDate,
      status: "not started",
      vendorId: vendor.vendor.id,
    });

    //assign order id to cart product
    await CartProduct.update(
      {
        ordered: true,
        orderId: order.id,
      },
      { where: { ordered: false, cartId: cart.id } }
    );

    cart.total_quantity = 0;

    cart.total = 0;

    await cart.save();

    //send order to vendor
    const vendorOrder = await getVendorOrder(vendor.userId, order.id);
    const vendorSocket = vendorSockets[vendor.userId];
    if (vendorSocket) {
      vendorSocket.emit("newOrder", vendorOrder);
    }

    const admins = await User.findAll({
      attributes: ["id"],
      where: { role: { [Op.in]: ["admin"] } },
    });

    await Notification.bulkCreate(
      admins.map((user) => {
        return {
          userId: user.id,
          title: "طلب جديد",
          description: `هناك طلب جديد من ${name}`,
          orderId: order.id,
        };
      })
    );

    const messaging = admin.messaging();

    await messaging.send({
      notification: {
        title: "طلب جديد",
        body: `هناك طلب جديد من ${name}`,
      },
      topic: "admin",
    });

    await messaging.send({
      notification: {
        title: "طلب جديد",
        body: `هناك طلب جديد من ${name}`,
      },
      topic: "delivery",
      android: {
        notification: {
          sound: "alarm.mp3", // Android specific sound configuration
          vibrateTimingsMillis: [0, 1000, 500, 1000, 2000, 1250], // Custom vibration pattern
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "alarm.mp3", // iOS specific sound configuration
          },
        },
      },
    });

    if (vendor.fcm) {
      await messaging.send({
        notification: {
          title: "طلب جديد",
          body: `هناك طلب جديد من ${name}`,
        },
        topic: `${vendor.phone}`,
        android: {
          notification: {
            sound: "alarm.mp3", // Android specific sound configuration
            vibrateTimingsMillis: [0, 1000, 500, 1000, 2000, 1250], // Custom vibration pattern
            priority: "high",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "alarm.mp3", // iOS specific sound configuration
            },
          },
        },
      });
    }

    await Notification.bulkCreate({
      userId: vendor.userId,
      title: "طلب جديد",
      description: `هناك طلب جديد من ${name}`,
      orderId: order.id,
    });

    return res.status(200).json({ message: "success", order });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.calculateShipping = async (req, res) => {
  const { areaId } = req.body;

  try {
    let time = 0;

    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const cart = await Cart.findOne({
      where: { userId: decodedToken.userId },
      include: [
        {
          model: CartProduct,
          include: [
            {
              model: Product,
              include: {
                model: User,
                attributes: ["id"],
                include: [{ model: Area }, Vendor],
              },
            },
          ],
          where: { ordered: false },
        },
      ],
    });

    const area = cart.cart_products[0]?.product.user.areas.find(
      (item) => item.id === +areaId
    );

    if (!area) {
      return res
        .status(400)
        .json({ message: "المطعم لا يدعم التوصيل لهذه المنطقه" });
    }

    return res.status(200).json({
      message: "success",
      shipping: +area.delivery_cost.cost,
      subtotal: +cart.total,
      total: +cart.total + +area.delivery_cost.cost,
      time: time,
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAllOrders = async (req, res) => {
  const { size, page, status, deliveryId, startDate, endDate } = req.query;
  try {
    const limit = Number.parseInt(size);
    const offset = (Number.parseInt(page) - 1) * limit;

    let orders = null;

    const filters = {};

    if (deliveryId) {
      filters.deliveryId = deliveryId;
    }

    if (status) {
      filters.status = status;
    }

    if (startDate) {
      filters.createdAt = {
        [Op.between]: [
          new Date(startDate),
          endDate ? new Date(endDate) : Date.now(),
        ],
      };
    }

    if (page) {
      orders = await Order.findAll({
        limit: limit,
        offset: offset,
        include: [
          { model: User, attributes: ["id", "name", "phone", "address"] },
          {
            model: CartProduct,
            required: false,
            include: [
              {
                model: Product,
                include: [
                  {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "address"],
                    include: {
                      model: Vendor,
                      attributes: ["id", "direction", "distance"],
                    },
                  },
                ],
              },
              Option,
            ],
            where: { ordered: true },
          },
          Vendor,
          Delivery,
          Area,
        ],
        where: filters,
        order: [["createdAt", "DESC"]],
      });
    } else {
      orders = await Order.findAll({
        include: [
          { model: User, attributes: ["id", "name", "phone", "address"] },
          { model: Delivery, include: User },
          {
            model: CartProduct,
            required: false,
            include: [
              {
                model: Product,
                include: [
                  {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "address"],
                    include: {
                      model: Vendor,
                      attributes: ["id", "direction", "distance"],
                    },
                  },
                ],
              },
              Option,
            ],
            where: { ordered: true },
          },
          Area,
        ],
        where: filters,
        order: [["createdAt", "DESC"]],
      });
    }

    const count = await Order.count({ where: filters }); // Get total number of products
    const numOfPages = Math.ceil(count / limit); // Calculate number of pages

    return res.status(200).json({ count, pages: numOfPages, results: orders });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, time } = req.body;

  try {
    // Validate order status
    const validOrderStatuses = [
      "not started",
      "started",
      "preparing",
      "finished",
      "in the way",
      "complete",
      "cancel",
      "deleted",
    ];
    if (!validOrderStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status value" });
    }

    const order = await Order.findByPk(id, {
      include: [
        User,
        Vendor,
        {
          model: CartProduct,
          include: [
            {
              model: Product,
            },
            Option,
          ],
        },
        Area,
        { model: Delivery, include: User },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status !== order.status) {
      // Map the order status to a valid VendorOrder status
      const messaging = admin.messaging();

      if (order.user.fcm) {
        await messaging
          .send({
            token: order.user.fcm,
            notification: {
              title: "تحديث للطلب",
              body:
                req.body.status === "in the way"
                  ? "تم بدء توصيل طلبك , في الطريق اليك"
                  : req.body.status === "complete"
                  ? "تم توصيل طلبك ,شكرا لك"
                  : req.body.status === "preparing"
                  ? "تم بدء تحضير طلبك"
                  : "تم الانتهاء من طلبك",
            },
          })
          .catch((error) => {});
      }

      await Notification.create({
        userId: order.user.id,
        title: "تحديث للطلب",
        description:
          req.body.status === "in the way"
            ? "تم بدء توصيل طلبك , في الطريق اليك"
            : req.body.status === "complete"
            ? "تم توصيل طلبك ,شكرا لك"
            : req.body.status === "preparing"
            ? "تم بدء تحضير طلبك"
            : "تم الانتهاء من طلبك",
      });
    }

    order.status = status;

    if (+time && +order.time < +time) {
      order.time = time;
      order.updatedTime = getCurrentDateTimeInPalestine();
    }

    await order.save();

    const vendorSocket = vendorSockets[order.vendor.userId];
    if (vendorSocket) {
      vendorSocket.emit("updatedOrder", order);
    }

    return res.status(200).json({ message: "success", order });
  } catch (error) {
    Logger.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.assignDelivery = async (req, res) => {
  const { id } = req.params;

  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const order = await Order.findByPk(id, {
      include: [
        User,
        Vendor,
        {
          model: CartProduct,
          include: [
            {
              model: Product,
            },
            Option,
          ],
        },
        Area,
      ],
    });

    if (order.deliveryId) {
      return res.status(400).json({ message: "order was taken" });
    }

    const messaging = admin.messaging();

    if (order.user.fcm) {
      await messaging
        .send({
          token: order.user.fcm,
          notification: {
            title: "تحديث للطلب",
            body: "تم بدء توصيل طلبك",
          },
        })
        .catch((error) => {});
    }

    await Notification.create({
      userId: order.user.id,
      title: "تحديث للطلب",
      description: "تم بدء توصيل طلبك",
    });

    await order.update({
      status: "in the way",
      deliveryId: decodedToken.userId,
    });

    const vendorSocket = vendorSockets[order.vendor.userId];

    if (vendorSocket) {
      vendorSocket.emit("updatedOrder", order);
    }

    return res.status(200).json({ message: "success", order });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getVendorOrder = async (req, res) => {
  const { size, page, status, vendorId, startDate, endDate } = req.query;

  try {
    const vendor = await Vendor.findOne({ where: { userId: vendorId } });

    const limit = Number.parseInt(size);

    const offset = (Number.parseInt(page) - 1) * limit;

    let orders = null;

    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (startDate) {
      filters.createdAt = {
        [Op.between]: [
          new Date(startDate),
          endDate ? new Date(endDate) : Date.now(),
        ],
      };
    }

    if (page) {
      orders = await Order.findAll({
        limit: limit,
        offset: offset,
        include: [
          {
            model: CartProduct,
            required: true,
            include: [
              {
                model: Product,
              },
              Option,
            ],
            where: { ordered: true, vendorId },
          },
          Area,
          {
            model: Delivery,
            attributes: ["id"],
            include: [{ model: User, attributes: ["id", "phone", "name"] }],
          },
        ],
        where: filters,
        order: [["createdAt", "DESC"]],
      });
    } else {
      orders = await Order.findAll({
        include: [
          {
            model: CartProduct,
            required: true,
            include: [
              {
                model: Product,
              },
              Option,
            ],
            where: { ordered: true, vendorId },
          },
          Area,
          { model: Delivery, include: User },
        ],
        where: filters,
        order: [["createdAt", "DESC"]],
      });
    }

    const count = await Order.count({ where: { vendorId: vendor.id } }); // Get total number of products

    const numOfPages = Math.ceil(count / limit); // Calculate number of pages

    return res.status(200).json({ count, pages: numOfPages, results: orders });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getVendorOrderById = async (req, res) => {
  const { vendorId } = req.query;
  const { id } = req.params;
  try {
    const costs = await DeliveryCost.findAll({ where: { userId: vendorId } });

    const orders = await Order.findByPk(id, {
      include: [
        {
          model: CartProduct,
          required: true,
          include: [
            {
              model: Product,
            },
            Option,
          ],
          where: { ordered: true, vendorId },
        },
        Area,
      ],
    });

    let total = 0;
    let total_quantity = 0;

    for (const e of orders.cart_products) {
      total = total + +e.total;
      total_quantity = total_quantity + +e.quantity;
    }

    const areaCost = costs.find((cost) => +cost.areaId === +orders.area.id);

    return res.status(200).json({
      order: {
        ...orders.toJSON(),
        subtotal: total,
        total: total + +areaCost.cost,
        shipping: areaCost.cost,
        total_quantity,
      },
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id, {
      include: [
        { model: User, attributes: ["id", "name", "phone", "address"] },
        {
          model: CartProduct,
          include: [
            {
              model: Product,
              include: [
                {
                  model: User,
                  attributes: ["id", "name", "email", "phone", "address"],
                  include: {
                    model: Vendor,
                    attributes: ["id", "direction", "distance"],
                  },
                },
              ],
            },
            Option,
          ],
          where: { ordered: true },
        },
      ],
    });

    let delivery = null;

    if (order.deliveryId) {
      delivery = await User.findByPk(order.deliveryId, {
        attributes: ["id", "name", "phone", "email"],
      });
    }

    return res.status(200).json({ message: "success", order, delivery });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const orders = await Order.findAll({
      include: [
        {
          model: CartProduct,
          include: [
            {
              model: Product,
              include: [
                {
                  model: User,
                  attributes: ["id", "name", "email", "phone", "address"],
                  include: {
                    model: Vendor,
                    attributes: ["id", "direction", "distance"],
                  },
                },
              ],
            },
            Option,
          ],
          where: { ordered: true },
        },
        { model: Delivery, include: User },
      ],
      where: { userId: decodedToken.userId },
    });

    return res.status(200).json({ message: "success", results: orders });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    await Order.destroy({ where: { id } });

    await Notification.destroy({ where: { orderId: id } });

    return res.status(200).json({ message: "order deleted" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.getVendorStatic = async (req, res) => {
  const { id } = req.params;

  try {
    const vendor = await Vendor.findOne({ where: { userId: id } });
    const stats = await Order.findAll({
      attributes: [
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("status")), "order_count"],
        [Sequelize.fn("SUM", Sequelize.col("total")), "total_sum"],
      ],
      where: { vendorId: vendor.id },
      group: ["status"],
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order stats",
      error: error.message,
    });
  }
};
