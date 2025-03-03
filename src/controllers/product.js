const Product = require("../models/product");

const ProductImage = require("../models/productImage");

const User = require("../models/user");

const Category = require("../models/category");

const { Op } = require("sequelize");
const OptionGroup = require("../models/optionGroup");
const Option = require("../models/option");
const Order = require("../models/order");
const Vendor = require("../models/vendor");
const Logger = require("../util/logger");
const Alert = require("../models/alert");

exports.createProduct = async (req, res) => {
  const {
    title,
    description,
    price,
    featured,
    available,
    vendorId,
    categoryId,
    show_price,
    offerPrice,
    isOffer,
  } = req.body;

  try {
    // Create the product with the provided data

    const product = await Product.create({
      title,
      description,
      price,
      available,
      featured,
      vendorId,
      categoryId,
      show_price,
      offerPrice,
      isOffer,
    });

    const images = await ProductImage.bulkCreate(
      req.files.image.map((file) => ({
        productId: product.id,
        image: file.location,
      }))
    );

    const imagesWithUrl = images.map((image) => {
      return {
        ...image.toJSON(),
        image: image.image,
      };
    });

    return res.status(201).json({
      message: "success",
      product: { ...product.toJSON(), images: imagesWithUrl },
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAll = async (req, res) => {
  const {
    size,
    page,
    featured,
    recent,
    bestSeller,
    vendorId,
    categoryId,
    search,
    isOffer,
  } = req.query;

  try {
    const limit = Number.parseInt(size);
    const offset = (Number.parseInt(page) - 1) * limit;

    const filters = {};

    const order = [];

    if (featured) {
      filters.featured = true;
    }

    if (search) {
      filters.title = { [Op.like]: `%${search}%` };
    }

    if (vendorId) {
      filters.vendorId = vendorId;
    }

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (bestSeller) {
      order.push(["orders", "DESC"]);
    }
    if (isOffer) {
      filters.isOffer = isOffer;
    }
    if (recent) {
      order.push(["createdAt", "DESC"]);
    }

    let products = [];

    if (page) {
      products = await Product.findAll({
        limit: limit,
        offset: offset,
        where: { ...filters },
        include: [
          {
            model: ProductImage,
            attributes: ["id", "image"],
          },
          {
            model: OptionGroup,
            attributes: ["id", "name", "type"],
            include: { model: Option, attributes: ["id", "name", "value"] },
          },
          {
            model: User,
            attributes: ["id", "name", "email", "phone", "image"],
            include: Vendor,
          },
          {
            model: Category,
            attributes: ["id", "name", "image"],
          },
        ],
        order: order,
      });
    } else {
      products = await Product.findAll({
        where: { ...filters },
        include: [
          {
            model: ProductImage,
            attributes: ["id", "image"],
          },
          {
            model: OptionGroup,
            attributes: ["id", "name", "type"],
            include: { model: Option, attributes: ["id", "name", "value"] },
          },
          {
            model: User,
            attributes: ["id", "name", "email", "phone", "image"],
            include: Vendor,
          },
          {
            model: Category,
            attributes: ["id", "name", "image"],
          },
        ],
        order: order,
      });
    }

    const count = await Product.count({ where: { ...filters } }); // Get total number of products
    const numOfPages = Math.ceil(count / limit); // Calculate number of pages

    return res
      .status(200)
      .json({ count: count, pages: numOfPages, results: products });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductImage,
          attributes: ["id", "image"],
        },
        {
          model: OptionGroup,
          attributes: ["id", "name", "type"],
          include: { model: Option },
        },
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "image"],
          include: Vendor,
        },
        {
          model: Category,
          attributes: ["id", "name", "image"],
        },
      ],
    });

    return res.status(200).json({ message: "success", product });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.editOne = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductImage,
          attributes: ["id", "image"],
        },
        {
          model: User,
          attributes: ["id", "name", "image"],
        },
        {
          model: Category,
          attributes: ["id", "name", "image"],
        },
      ],
    });

    await product.update(req.body);

    if (req.files.image) {
      await ProductImage.destroy({ where: { productId: product.id } });

      await ProductImage.bulkCreate(
        req.files.image?.map((file) => ({
          productId: product.id,
          image: file.location,
        }))
      );
    }

    return res.status(200).json({
      message: "success",
      product,
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res) => {
  const { id } = req.params;
  try {
    Product.destroy({ where: { id } }).then(() =>
      res.json({ message: "deleted" })
    );
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteProductImage = async (req, res) => {
  const { id } = req.params;

  ProductImage.destroy({ where: { id } })
    .then(() => res.json({ message: "deleted" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.dataAnalysis = async (req, res) => {
  try {
    const products = await Product.count(); // Get total number of products

    const customers = await User.count({ where: { role: "customer" } }); // Get total number of customers

    const onlineDeliveries = await User.count({
      where: { role: "customer", online: true },
    });

    const orders = await Order.count();

    const app_status = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "app_status",
      },
    });

    const alert = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "alert",
      },
    });

    return res.status(200).json({
      products,
      customers,
      orders,
      onlineDeliveries,
      app_status,
      alert,
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
