const jwt = require("jsonwebtoken");

const UserFavoriteProduct = require("../models/UserFavoriteproduct");
const User = require("../models/user");
const Product = require("../models/product");
const ProductImage = require("../models/productImage");
const Category = require("../models/category");

exports.toggleFavoriteProduct = async (req, res) => {
  const productId = req.body.productId;

  try {
    // Get the user ID from the authorization header
    const token = req.headers.authorization.split(" ")[1];

    const user = await User.findOne({
      where: { token },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    const favouriteProduct = await UserFavoriteProduct.findOne({
      where: { productId, userId: user.id },
    });

    if (favouriteProduct) {
      await UserFavoriteProduct.destroy({ where: { id: favouriteProduct.id } });
      return res.json({ message: "تم الازاله من المفضله" });
    }

    await UserFavoriteProduct.create({
      userId: user.id,
      productId,
    });

    return res.status(200).json({ message: "تم الاضافه الى المفضله" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getUserFavoriteProducts = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const user = await User.findOne({
      where: { token },
      include: [
        {
          model: Product,
        },
      ],
    });

    return res.status(200).json({ results: user.products });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
