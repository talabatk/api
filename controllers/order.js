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
const VendorOrder = require("../models/vendorOrders");
const admin = require("firebase-admin");
const Notification = require("../models/notifications");
const { Op } = require("sequelize");
const DeliveryCost = require("../models/delivery_cost");

exports.createOrder = async (req, res) => {
  const { areaId, address, name, phone, location, notes } = req.body;

  try {
    let vendors = [];

    let shippingDirections = [];

    let shipping = 0;

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

    // calculate shipping cost
    cart.cart_products.forEach(async (e) => {
      const area = e.product.user.areas.find((item) => item.id === +areaId);

      if (!area) {
        return res
          .status(400)
          .json({ message: "المطعم لا يدعم التوصيل لهذه المنطقه" });
      }

      const directionIndex = shippingDirections.findIndex(
        (item) => item.vendor === e.product.vendorId
      );

      if (directionIndex < 0) {
        shippingDirections.push({
          vendor: +e.product.vendorId,
          free_limit: +e.product.user.vendor.free_delivery_limit,
          cost: +area.delivery_cost.cost,
          time: +e.product.user.vendor.delivery_time,
          distance: +e.product.user.vendor.distance,
          total: +e.total,
        });
      } else {
        shippingDirections[directionIndex] = {
          vendor: +e.product.vendorId,
          free_limit: +e.product.user.vendor.free_delivery_limit,
          cost: +area.delivery_cost.cost,
          time: +e.product.user.vendor.delivery_time,
          distance: +e.product.user.vendor.distance,
          total: +e.total + +shippingDirections[directionIndex].total,
        };
      }

      await Product.update(
        { orders: +e.product.orders + +e.quantity },
        { where: { id: e.product.id } }
      );

      const vendorIndex = vendors.findIndex(
        (item) => +item.vendorId === +e.product.user.vendor.id
      );

      if (vendorIndex < 0) {
        vendors.push({
          userId: +e.product.user.id,
          vendorId: +e.product.user.vendor.id,
          fcm: e.product.user.vendor.fcm,
        });
      }
    });

    shippingDirections.forEach((e) => {
      if (!e.free_limit || e.free_limit > e.total) {
        shipping = shipping + e.cost;
      }
    });

    //save order
    const order = await Order.create({
      address,
      total_quantity: cart.total_quantity,
      subtotal: +cart.total,
      shipping,
      name,
      phone,
      location,
      notes,
      total: shipping + +cart.total,
      userId: decodedToken.userId,
      areaId,
    });

    //save vendor orders
    await VendorOrder.bulkCreate(
      vendors.map((item) => {
        return {
          vendorId: item.vendorId,
          orderId: order.id,
        };
      })
    );

    //assign order id to cart product
    await CartProduct.update(
      {
        ordered: true,
        orderId: order.id,
      },
      { where: { ordered: false, cartId: cart.id } }
    );

    const admins = await User.findAll({
      attributes: ["id"],
      where: { role: { [Op.in]: ["admin"] } },
    });

    const notifications = await Notification.bulkCreate(
      admins.map((user) => {
        return {
          userId: user.id,
          title: "طلب جديد",
          description: `${name} هناك طلب جديد من`,
          orderId: order.id,
        };
      })
    );

    const messaging = admin.messaging();

    await messaging.send({
      notification: {
        title: "طلب جديد",
        body: `${name} هناك طلب جديد من`,
      },
      topic: "admin",
    });

    vendors.forEach(async (e) => {
      if (e.fcm) {
        await messaging.send({
          token: e.fcm,
          notification: {
            title: "طلب جديد",
            body: `هناك طلب جديد من ${name}`,
          },
        });
      }
    });

    const vendorNotifications = await Notification.bulkCreate(
      vendors.map((user) => {
        return {
          userId: user.userId,
          title: "طلب جديد",
          description: `${name} هناك طلب جديد من`,
          orderId: order.id,
        };
      })
    );

    cart.total_quantity = 0;

    cart.total = 0;

    await cart.save();

    return res.status(200).json({ message: "success", order });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.calculateShipping = async (req, res) => {
  const { areaId } = req.body;

  try {
    let shippingDirections = [];

    let shipping = 0;

    let time = 0;

    let distance = 0;

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

    if (cart?.cart_products) {
      cart.cart_products.forEach((e) => {
        const area = e.product.user.areas.find((item) => item.id === +areaId);

        if (!area) {
          return res
            .status(400)
            .json({ message: "المطعم لا يدعم التوصيل لهذه المنطقه" });
        }

        const directionIndex = shippingDirections.findIndex(
          (item) => item.vendor === e.product.vendorId
        );

        if (directionIndex < 0) {
          shippingDirections.push({
            vendor: +e.product.vendorId,
            free_limit: +e.product.user.vendor.free_delivery_limit,
            cost: +area.delivery_cost.cost,
            time: +e.product.user.vendor.delivery_time,
            distance: +e.product.user.vendor.distance,
            total: +e.total,
          });
        } else {
          shippingDirections[directionIndex] = {
            vendor: +e.product.vendorId,
            free_limit: +e.product.user.vendor.free_delivery_limit,
            cost: +area.delivery_cost.cost,
            time: +e.product.user.vendor.delivery_time,
            distance: +e.product.user.vendor.distance,
            total: +e.total + +shippingDirections[directionIndex].total,
          };
        }
      });
    }

    shippingDirections.forEach((e) => {
      if (!e.free_limit || e.free_limit > e.total) {
        shipping = shipping + e.cost;
      }
      time = time + e.time;
      distance = distance + e.distance;
    });

    return res.status(200).json({
      message: "success",
      shipping,
      subtotal: +cart.total,
      total: +cart.total + shipping,
      time: time,
      distance: distance,
      shippingDirections,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAllOrders = async (req, res) => {
  const { size, page, status, deliveryId } = req.query;
  try {
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;

    let orders = null;

    let filters = {};

    if (deliveryId) {
      filters.deliveryId = deliveryId;
    }

    if (status) {
      filters.status = status;
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
          Area,
        ],
        where: filters,
        order: [["createdAt", "DESC"]],
      });
    } else {
      orders = await Order.findAll({
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
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id, {
      include: User,
    });

    if (req.body.status !== order.status) {
      await VendorOrder.update(
        { status: req.body.status },
        { where: { orderId: id } }
      );

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
          .catch((error) => {
            console.log(error);
          });
      }
      if (req.body.status === "finished") {
        const deliveries = await User.findAll({
          attributes: ["id"],
          where: { role: { [Op.in]: ["delivery"] } },
        });

        const notifications = await Notification.bulkCreate(
          deliveries.map((user) => {
            return {
              userId: user.id,
              title: "طلب جديد",
              description: `هناك طلب جديد `,
              orderId: id,
            };
          })
        );

        const messaging = admin.messaging();

        await messaging.send({
          notification: {
            title: "طلب جديد",
            body: `${name} هناك طلب جديد من`,
          },
          topic: "delivery",
        });
      }

      await Notification.create({
        userId: order.user.id,
        title: "تحديث للطلب",
        description: `${req.body.status} تم تغيير حاله طلبك الي`,
      });
    }

    await order.update(req.body);

    return res.status(200).json({ message: "success", order });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.assignDelivery = async (req, res) => {
  const { id } = req.params;

  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const order = await Order.findByPk(id, {
      include: User,
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
            body: `تم بدء توصيل طلبك`,
          },
        })
        .catch((error) => {
          console.log(error);
        });
    }

    await Notification.create({
      userId: order.user.id,
      title: "تحديث للطلب",
      description: `تم بدء توصيل طلبك`,
    });

    await order.update({
      status: "in the way",
      deliveryId: decodedToken.userId,
    });

    await VendorOrder.update(
      { status: "in the way" },
      { where: { orderId: id } }
    );

    return res.status(200).json({ message: "success", order });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getVendorOrder = async (req, res) => {
  const { size, page, status, vendorId } = req.query;

  try {
    const vendor = await Vendor.findOne({ where: { userId: vendorId } });

    const limit = parseInt(size);

    const offset = (parseInt(page) - 1) * limit;

    let orders = null;

    let filters = {};

    if (status) {
      filters.status = status;
    }

    if (page) {
      orders = await Order.findAll({
        limit: limit,
        offset: offset,
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
        where: filters,
        order: [["createdAt", "DESC"]],
      });
    } else {
      orders = await Order.findAll({
        attributes: [
          "id",
          "status",
          "name",
          "phone",
          "shipping",
          "address",
          "total",
          "createdAt",
          "notes",
        ],
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
        where: filters,
        order: [["createdAt", "DESC"]],
      });
    }

    const costs = await DeliveryCost.findAll({ where: { userId: vendorId } });

    orders = orders.map((order) => {
      let total = 0;
      order.cart_products.forEach((e) => {
        total = total + +e.total;
      });

      const areaCost = costs.find((cost) => +cost.areaId === +order.area.id);

      return {
        ...order.toJSON(),
        total: total,
        shipping: areaCost.cost,
      };
    });

    const count = await VendorOrder.count({ where: { vendorId: vendor.id } }); // Get total number of products

    const numOfPages = Math.ceil(count / limit); // Calculate number of pages

    return res.status(200).json({ count, pages: numOfPages, results: orders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getVendorOrderById = async (req, res) => {
  const { vendorId } = req.query;
  const { id } = req.params;
  try {
    const costs = await DeliveryCost.findAll({ where: { userId: vendorId } });

    let orders = await Order.findByPk(id, {
      attributes: [
        "id",
        "status",
        "name",
        "phone",
        "address",
        "shipping",
        "total",
        "createdAt",
        "notes",
      ],
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
    orders.cart_products.forEach((e) => {
      total = total + +e.total;
      total_quantity = total_quantity + +e.quantity;
    });

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
    console.log(error);
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

    return res.status(200).json({ message: "success", order });
  } catch (error) {
    console.log(error);
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
      ],
      where: { userId: decodedToken.userId },
    });

    return res.status(200).json({ message: "success", results: orders });
  } catch (error) {
    console.log(error);
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
