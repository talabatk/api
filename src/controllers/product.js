const { startOfMonth, subMonths } = require("date-fns");
const Product = require("../models/product.js");
const ProductImage = require("../models/productImage.js");
const User = require("../models/user.js");
const Category = require("../models/category.js");
const { Op, col, fn } = require("sequelize");
const OptionGroup = require("../models/optionGroup.js");
const Option = require("../models/option.js");
const Order = require("../models/order.js");
const Vendor = require("../models/vendor.js");
const Logger = require("../util/logger.js");
const Alert = require("../models/alert.js");
const CartProduct = require("../models/cartProduct.js");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const os = require("os");
const City = require("../models/city.js");
const Area = require("../models/area.js");
const Admin = require("../models/admin.js");

const getMonthlySales = async (cityId) => {
  // من أول يوم في الشهر الحالي - 11 شهر (آخر 12 شهر)
  const startDate = startOfMonth(subMonths(new Date(), 11));

  const result = await Order.findAll({
    attributes: [
      // نجيب السنة والشهر
      [fn("YEAR", col("createdAt")), "year"],
      [fn("MONTH", col("createdAt")), "month"],
      // مجموع المدفوع
      [fn("SUM", col("total")), "total"],
      // مجموع الكمية
      [fn("SUM", col("shipping")), "shipping"],
    ],
    where: cityId
      ? {
          cityId: +cityId,
          createdAt: {
            [Op.gte]: startDate,
          },
        }
      : {
          createdAt: {
            [Op.gte]: startDate,
          },
        },
    group: [fn("YEAR", col("createdAt")), fn("MONTH", col("createdAt"))],
    order: [
      [fn("YEAR", col("createdAt")), "ASC"],
      [fn("MONTH", col("createdAt")), "ASC"],
    ],
    raw: true,
  });

  // نرجعهم بشكل مرتب (YYYY-MM => {totalPaid, totalQty})
  const monthly = result.reduce((acc, row) => {
    const monthKey = `${row.year}-${row.month}`;
    acc[monthKey] = {
      total: parseFloat(row.total) || 0,
      shipping: parseInt(row.shipping) || 0,
    };
    return acc;
  });

  return monthly;
};

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

    let image = null;
    if (req.files[0]) {
      image = await ProductImage.create({
        productId: product.id,
        image: req.files[0].location,
      });
    }

    return res.status(201).json({
      message: "success",
      product: { ...product.toJSON(), images: image },
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
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: { token },
      include: [{ model: Admin }],
      attributes: { exclude: ["password"] },
    });
    let cityId = null;
    if (user && user?.admin && !user.admin?.super_admin) {
      cityId = user.cityId;
    }

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
            include: {
              model: Option,
              attributes: ["id", "name", "value", "image"],
            },
          },
          {
            model: User,
            attributes: ["id", "name", "email", "phone", "image"],
            include: Vendor,
            where: cityId
              ? {
                  active: true,
                  cityId,
                }
              : {
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
            include: {
              model: Option,
              attributes: ["id", "name", "value", "image"],
            },
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
    const fileUrl = req.files[0].location;
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

    if (req.files[0]) {
      await ProductImage.destroy({ where: { productId: product.id } });

      await ProductImage.create({
        productId: product.id,
        image: req.files[0].location,
      });
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
  let { cityId } = req.query;
  try {
    const token = req.headers.authorization.split(" ")[1]; // get token from Authorization header

    const user = await User.findOne({
      where: { token },
      include: [{ model: Admin }],
      attributes: { exclude: ["password"] },
    });
    if (user && user.admin && !user.admin.super_admin) {
      cityId = user.cityId;
    }

    const products = await Product.count(); // Get total number of products

    const areas = await Area.count({
      where: cityId ? { cityId: +cityId } : {},
    }); // Get total number of products

    const customers = await User.count({
      where: cityId
        ? { role: "customer", cityId: +cityId }
        : { role: "customer" },
    }); // Get total number of customers

    const vendors = await User.count({
      where: cityId
        ? { role: "vendor", active: true, cityId: +cityId }
        : { role: "vendor", active: true },
    }); // Get total number of vendors

    const onlineDeliveries = await User.count({
      where: cityId
        ? { role: "delivery", online: true, cityId: +cityId }
        : { role: "delivery", online: true },
    });

    const orders = await Order.count({
      where: cityId ? { cityId: +cityId } : {},
    });

    const deletedOrders = await Order.count({
      where: cityId ? { cityId: +cityId, deleted: true } : { deleted: true },
    });

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
    const mothly = await getMonthlySales(cityId);

    return res.status(200).json({
      products,
      customers,
      orders,
      vendors,
      areas,
      mothly,
      activeOrders: orders - deletedOrders,
      deletedOrders,
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
