const Cart = require("../models/cart");
const jwt = require("jsonwebtoken");
const CartProduct = require("../models/cartProduct");
const Product = require("../models/product");
const Option = require("../models/option");
const { Op } = require("sequelize");
const CartProductOption = require("../models/cartProductOption");
const ProductImage = require("../models/productImage");
const Logger = require("../util/logger");

exports.getUserCart = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const [cart, created] = await Cart.findOrCreate({
      where: { userId: decodedToken.userId },
      include: [
        {
          model: CartProduct,
          required: false,
          include: [
            {
              model: Product,
              include: [
                {
                  model: ProductImage,
                  attributes: ["id", "image"],
                },
              ],
            },
            Option,
          ],
          where: { ordered: false },
        },
      ],
      defaults: {
        userId: decodedToken.userId,
      },
    });

    return res.status(200).json({ message: "success", cart });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.addToCart = async (req, res) => {
  const { productId, quantity, notes, options } = req.body;
  try {
    let subtotal = 0;

    let total = 0;
    console.log("quantity", quantity);

    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const [cart, created] = await Cart.findOrCreate({
      where: { userId: decodedToken.userId },
      defaults: {
        userId: decodedToken.userId,
      },
    });

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    const cartProducts = await CartProduct.findAll({
      where: {
        ordered: false,
        cartId: cart.id,
      },
      include: [Product],
    });
    // calculate shipping cost
    for (const e of cartProducts) {
      if (+e.product.vendorId !== +product.vendorId) {
        return res
          .status(400)
          .json({ message: "لا يمكنك طلب طلبيه بأكثر من مطعم في نفس الطلبيه" });
      }
    }
    if (product.isOffer) {
      subtotal += Number(product.offerPrice); // Convert explicitly to a number
    } else {
      subtotal += Number(product.price); // Convert explicitly to a number
    }

    let optionsRes = [];
    if (options) {
      optionsRes = await Option.findAll({
        where: { id: { [Op.in]: options } },
      });
      for (const option of optionsRes) {
        subtotal = subtotal + +option.value;
      }
    }

    total = total + quantity * subtotal;

    const cartProduct = await CartProduct.create({
      quantity,
      productId,
      notes,
      subtotal,
      total,
      cartId: cart.id,
      vendorId: product.vendorId,
    });

    cart.total = +cart.total + total;
    cart.total_quantity = +cart.total_quantity + +quantity;

    await cart.save();

    const cartProductOption = await CartProductOption.bulkCreate(
      optionsRes?.map((option) => {
        return {
          optionId: option.id,
          cartProductId: cartProduct.id,
        };
      })
    );

    return res
      .status(201)
      .json({ message: "success", cart, cartProduct, cartProductOption });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.updateCartProduct = async (req, res) => {
  const { quantity } = req.body;
  const { id } = req.params;

  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const cart = await Cart.findOne({ where: { userId: decodedToken.userId } });

    const cartProduct = await CartProduct.findByPk(id);

    const oldTotal = +cartProduct.total;

    const oldQuantity = +cartProduct.quantity;

    cartProduct.total = +quantity * +cartProduct.subtotal;

    cartProduct.quantity = quantity;

    await cartProduct.save();

    cart.total = +cart.total + cartProduct.total - oldTotal;

    cart.total_quantity = +cart.total_quantity + +quantity - oldQuantity;

    await cart.save();

    return res.status(200).json({ message: "success" });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteCartProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const cart = await Cart.findOne({ where: { userId: decodedToken.userId } });

    const cartProduct = await CartProduct.findByPk(id);

    if (!cart || !cartProduct) {
      return res.status(500).json({ message: "internal server error" });
    }
    cart.total = +cart.total - +cartProduct.total;

    cart.total_quantity = +cart.total_quantity - +cartProduct.quantity;

    await cart.save();

    CartProduct.destroy({ where: { id } }).then(() =>
      res.json({ message: "cart product deleted" })
    );
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
