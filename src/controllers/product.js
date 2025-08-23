const Product = require("../models/product");

const ProductImage = require("../models/productImage");

const User = require("../models/user");

const Category = require("../models/category");

const { Op, where } = require("sequelize");
const OptionGroup = require("../models/optionGroup");
const Option = require("../models/option");
const Order = require("../models/order");
const Vendor = require("../models/vendor");
const Logger = require("../util/logger");
const Alert = require("../models/alert");
const CartProduct = require("../models/cartProduct");
const Cart = require("../models/cart");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const os = require("os");
const City = require("../models/city");

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
    order,
  } = req.body;

  try {
    // Create the product with the provided data
    const user = await User.findOne({
      where: {
        id: vendorId,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    const product = await Product.create({
      title,
      description,
      price,
      available,
      featured,
      vendorId,
      categoryId,
      show_price,
      offerPrice: offerPrice || 0,
      isOffer,
      order,
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

    if (isOffer && isOffer === "true") {
      filters.isOffer = isOffer === "true" ? true : false;
    }

    if (bestSeller && bestSeller === "true") {
      order.push(["orders", "DESC"]);
    } else if (recent) {
      order.push(["createdAt", "DESC"]);
    } else {
      order.push(["order", "ASC"]);
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
            where: {
              active: true,
            },
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
            where: {
              active: true,
            },
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

exports.bulkCreate = async (req, res) => {
  try {
    // Assuming file uploaded via multer and available at req.file.path
    const fileUrl = req.files.image[0].location;
    const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.xlsx`);

    // Download the file from Spaces
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(tempFilePath, response.data);

    const workbook = XLSX.readFile(tempFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const products = data.map((row) => ({
      title: row.name,
      description: row.name,
      categoryId: Number(row.category),
      price: row.price,
      vendorId: 1649,
    }));

    // Save to DB
    const results = await Product.bulkCreate(products); // Or your ORM logic

    const images = await ProductImage.bulkCreate(
      data.map((row, index) => ({
        productId: results[index].id,
        image:
          "https://talabatk-bucket.fra1.digitaloceanspaces.com/uploads/images/image-1735310942353-272872000.jpeg",
      }))
    );
    // Optional: delete file after processing

    res.status(200).json({
      message: "Products created successfully",
      count: products.length,
    });
  } catch (error) {
    console.error("Error bulk creating products:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
    if (!product) {
      return res.status(404).json({ message: "لا يوجد منتج بهذا الرقم" });
    }

    return res.status(200).json({ message: "success", product });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getOneProduct = async (req, res) => {
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
    if (!product) {
      return res.status(404).json({ message: "لا يوجد منتج بهذا الرقم" });
    }

    return res.status(200).json({ message: "success", results: product });
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

    if (req.body.isOffer === false && product.isOffer === true) {
      const cartProducts = await CartProduct.findAll({
        include: [
          {
            model: Product,
          },
          Option,
        ],
        where: {
          productId: product.id,
          ordered: false,
        },
      });

      for (const e of cartProducts) {
        let oldSubTotal = 0,
          oldTotal = 0,
          newSubtotal = 0,
          newTotal = 0;
        oldSubTotal = +e.subtotal;
        oldTotal = +e.total;
        newSubtotal = +e.price;

        for (const option of e.options) {
          newSubtotal = newSubtotal + +option.value;
        }

        newTotal = newSubtotal * +e.quantity;

        await CartProduct.update(
          {
            subtotal: newSubtotal,
            total: newTotal,
          },
          {
            where: {
              id: e.id,
            },
          }
        );
      }
    }

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
      where: { role: "delivery", online: true },
    });

    const orders = await Order.count();

    const app_status = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "app_status",
      },
      include: [City],
    });

    const alert = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "alert",
      },
      include: [City],
    });

    const banner = await Alert.findOne({
      attributes: ["content", "status", "image", "discription"],
      where: {
        name: "banner",
      },
      include: [City],
    });

    const points = await Alert.findOne({
      attributes: ["content", "active"],
      where: {
        name: "points",
      },
    });
    return res.status(200).json({
      products,
      customers,
      orders,
      onlineDeliveries,
      app_status,
      alert,
      banner,
      points,
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
