const Cart = require("../models/cart");
const jwt = require("jsonwebtoken");
const CartProduct = require("../models/cartProduct");
const Product = require("../models/product");
const Option = require("../models/option");
const { Op } = require("sequelize");
const OptionGroup = require("../models/optionGroup");
const CartProductOption = require("../models/cartProductOption");
const ProductImage = require("../models/productImage");
const Sequelize = require("sequelize");

exports.getUserCart = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

    const [cart, created] = await Cart.findOrCreate({
      where: { userId: decodedToken.userId },
      defaults: {
        userId: decodedToken.userId,
      },
      include: [
        {
          model: CartProduct,
          include: [
            {
              model: Product,
              include: [
                {
                  model: ProductImage,
                  attributes: [
                    "id",
                    [
                      Sequelize.literal(
                        `CONCAT("http://${req.get(
                          "host"
                        )}/uploads/", \`cart_products->product->productImages\`.\`image\`)`
                      ),
                      "image",
                    ],
                  ],
                },
              ],
            },
            Option,
          ],
          where: { ordered: false },
        },
      ],
    });

    return res.status(200).json({ message: "success", cart });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.addToCart = async (req, res) => {
  const { productId, quantity, notes, options } = req.body;
  try {
    let subtotal = 0;

    let total = 0;

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

    subtotal = subtotal + +product.price;

    const optionsRes = await Option.findAll({
      where: { id: { [Op.in]: options } },
      include: OptionGroup,
    });

    optionsRes.forEach((option) => {
      subtotal = subtotal + +option.value;
    });

    total = total + quantity * subtotal;

    const cartProduct = await CartProduct.create({
      quantity,
      productId,
      notes,
      subtotal,
      total,
      cartId: cart.id,
    });

    cart.total = +cart.total + total;
    cart.total_quantity = +cart.total_quantity + +quantity;

    await cart.save();

    const cartProductOption = await CartProductOption.bulkCreate(
      optionsRes.map((option) => {
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
    console.log(error);
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
    console.log(error);
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

    cart.total = +cart.total - +cartProduct.total;

    cart.total_quantity = +cart.total_quantity - +cartProduct.quantity;

    await cart.save();

    CartProduct.destroy({ where: { id } }).then(() =>
      res.json({ message: "cart product deleted" })
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
