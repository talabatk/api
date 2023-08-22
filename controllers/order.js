const Area = require("../models/area");
const Cart = require("../models/cart");
const CartProduct = require("../models/cartProduct");
const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");
const Option = require("../models/option");

exports.createOrder = async (req, res) => {
  const { areaId, address, name, phone, location, notes } = req.body;

  try {
    let shippingDirections = [];

    let shipping = 0;

    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    if (+cart.total_quantity === 0) {
      return res.status(400).json({ message: "no items in cart" });
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
                attributes: ["id"],
                include: [{ model: Area }, Vendor],
              },
            },
          ],
          where: { ordered: false },
        },
      ],
    });

    cart.cart_products.forEach((e) => {
      const area = e.product.user.areas.find((item) => item.id === +areaId);

      const directionIndex = shippingDirections.findIndex(
        (item) => item.direction === e.product.user.vendor.direction
      );

      if (directionIndex >= 0) {
        const direction = shippingDirections[directionIndex];

        if (direction.cost < +area.delivery_cost.cost) {
          shippingDirections[directionIndex] = {
            vendor: +e.product.user.vendor.id,
            cost: +area.delivery_cost.cost,
            direction: e.product.user.vendor.direction,
          };
        }
      } else {
        shippingDirections.push({
          vendor: +e.product.user.vendor.id,
          cost: +area.delivery_cost.cost,
          direction: e.product.user.vendor.direction,
        });
      }
    });

    shippingDirections.forEach((e) => {
      shipping = shipping + e.cost;
    });

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
    });

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

        const directionIndex = shippingDirections.findIndex(
          (item) => item.direction === e.product.user.vendor.direction
        );

        if (directionIndex >= 0) {
          const direction = shippingDirections[directionIndex];

          if (direction.cost < +area.delivery_cost.cost) {
            shippingDirections[directionIndex] = {
              vendor: +e.product.user.vendor.id,
              cost: +area.delivery_cost.cost,
              direction: e.product.user.vendor.direction,
            };
          }
        } else {
          shippingDirections.push({
            vendor: +e.product.user.vendor.id,
            cost: +area.delivery_cost.cost,
            direction: e.product.user.vendor.direction,
          });
        }
      });
    }

    shippingDirections.forEach((e) => {
      shipping = shipping + e.cost;
    });

    return res.status(200).json({ message: "success", shipping });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAllOrders = async (req, res) => {
  const { size, page, vendorId, deliveryId } = req.query;
  try {
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;

    let orders = null;

    if (page) {
      orders = await Order.findAll({
        limit: limit,
        offset: offset,
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
                    attributes: ["id", "name", "phone", "address"],
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
        order: [["createdAt", "DESC"]],
      });
    } else {
      orders = await Order.findAll({
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
                    attributes: ["id", "name", "phone", "address"],
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
            order: [["createdAt", "DESC"]],
          },
        ],
      });
    }

    const count = await Order.count(); // Get total number of products
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
    const order = await Order.update(req.body, { where: { id } });

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

    const order = await Order.update(
      { status: "started", deliveryId: decodedToken.userId },
      { where: { id } }
    );

    return res.status(200).json({ message: "success", order });
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
                  attributes: ["id", "name", "phone", "address"],
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
                  attributes: ["id", "name", "phone", "address"],
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

  Order.destroy({ where: { id } })
    .then(() => res.json({ message: "order deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
