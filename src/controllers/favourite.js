const jwt = require("jsonwebtoken");

const UserFavoriteProduct = require("../models/UserFavoriteproduct");
const User = require("../models/user");
const Product = require("../models/product");
const ProductImage = require("../models/productImage");
const Category = require("../models/category");

const Sequelize = require("sequelize");
const UserFavoriteVendor = require("../models/userFavoriteVendors");

exports.toggleFavoriteProduct = async (req, res) => {
    const productId = req.body.productId;

    try {
        // Get the user ID from the authorization header
        const token = req.headers.authorization.split(" ")[1];

        const user = await User.findOne({
            where: { token }
        });

        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({ message: "المنتج غير موجود" });
        }

        const favouriteProduct = await UserFavoriteProduct.findOne({
            where: { productId, userId: user.id }
        });

        if (favouriteProduct) {
            await UserFavoriteProduct.destroy({ where: { id: favouriteProduct.id } });
            return res.json({ message: "تم الازاله من المفضله" });
        }

        await UserFavoriteProduct.create({
            userId: user.id,
            productId
        });

        return res.status(200).json({ message: "تم الاضافه الى المفضله" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.getUserFavoriteProducts = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];

        const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

        const userFavorites = await UserFavoriteProduct.findAll({
            where: { userId: decodedToken.userId },
            include: [
                {
                    model: Product,
                    include: [
                        {
                            model: ProductImage,
                            attributes: ["id", "image"]
                        },
                        {
                            model: User,
                            attributes: ["id", "name", "image"]
                        },
                        {
                            model: Category,
                            attributes: ["id", "name", "image"]
                        }
                    ]
                }
            ],
            attributes: ["id"],
            order: [["createdAt", "DESC"]]
        });

        const results = userFavorites.map((item) => item.product);

        return res.status(200).json({ results: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.toggleFavoriteVendor = async (req, res) => {
    const vendorId = req.body.vendorId;

    try {
        // Get the user ID from the authorization header
        const token = req.headers.authorization.split(" ")[1];

        const user = await User.findOne({
            where: { token }
        });

        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        const vendor = await User.findByPk(vendorId);

        if (!vendor) {
            return res.status(404).json({ message: "المحل غير موجود" });
        }

        const favouriteVendor = await UserFavoriteVendor.findOne({
            where: { vendorId, userId: user.id }
        });

        if (favouriteVendor) {
            await UserFavoriteVendor.destroy({ where: { id: favouriteVendor.id } });
            return res.json({ message: "تم الازاله من المفضله" });
        }

        await UserFavoriteVendor.create({
            userId: user.id,
            vendorId
        });

        return res.status(200).json({ message: "تم الاضافه الى المفضله" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.getUserfavoriteVendors = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];

        const decodedToken = jwt.verify(token, "talabatek2309288/k_ss-jdls88");

        const favouriteVendors = await UserFavoriteVendor.findAll({
            where: { userId: decodedToken.userId },
            include: [
                {
                    model: User,
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "phone",
                        [
                            Sequelize.literal(`CONCAT("http://${req.get("host")}/uploads/", user.image)`),
                            "image"
                        ]
                    ]
                }
            ],
            attributes: ["id"],
            order: [["createdAt", "DESC"]]
        });

        const results = favouriteVendors.map((item) => item.user);

        return res.status(200).json({ results: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};
