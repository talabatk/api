const Product = require("../models/product");

const ProductImage = require("../models/productImage");

const User = require("../models/user");

const Category = require("../models/category");

const Sequelize = require("sequelize");
const VendorCategory = require("../models/vendorCategories");
const OptionGroup = require("../models/optionGroup");
const Option = require("../models/option");
const ProductGroup = require("../models/productGroup");

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
  } = req.body;

  try {
    // Create the product with the provided data
    const vendorCategory = await VendorCategory.findOne({
      where: { categoryId, userId: vendorId },
    });

    if (vendorCategory) {
      vendorCategory.products_number = +vendorCategory.products_number + 1;
      await vendorCategory.save();
    } else {
      await VendorCategory.create({
        categoryId,
        userId: vendorId,
        products_number: 1,
      });
    }

    let product = await Product.create({
      title,
      description,
      price,
      available,
      featured,
      vendorId,
      categoryId,
      show_price,
    });

    const vendorOptionGroups = await OptionGroup.findAll({
      where: { vendorId },
    });

    if (vendorOptionGroups) {
      await ProductGroup.bulkCreate(
        vendorOptionGroups.map((group) => {
          return {
            productId: product.id,
            optionsGroupId: group.id,
          };
        })
      );
    }

    const images = await ProductImage.bulkCreate(
      req.files.image.map((file) => ({
        productId: product.id,
        image: file.filename,
      }))
    );

    const imagesWithUrl = images.map((image) => {
      return {
        ...image.toJSON(),
        image: "https://" + req.get("host") + "/uploads/" + image.image,
      };
    });

    return res.status(201).json({
      message: "success",
      product: { ...product.toJSON(), images: imagesWithUrl },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.getAll = async (req, res) => {
  const { size, page, featured, recent, bestSeller, vendorId, categoryId } =
    req.query;

  try {
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;

    let filters = {};

    let order = [];

    if (featured) {
      filters.featured = true;
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
            attributes: [
              "id",
              [
                Sequelize.literal(
                  `CONCAT("https://${req.get(
                    "host"
                  )}/uploads/", productImages.image)`
                ),
                "image",
              ],
            ],
          },
          {
            model: OptionGroup,
            attributes: ["id", "name", "type"],
            include: { model: Option, attributes: ["id", "name", "value"] },
          },
          {
            model: User,
            attributes: [
              "id",
              "name",
              "email",
              "phone",
              [
                Sequelize.literal(
                  `CONCAT("https://${req.get("host")}/uploads/", user.image)`
                ),
                "image",
              ],
            ],
          },
          {
            model: Category,
            attributes: [
              "id",
              "name",
              [
                Sequelize.literal(
                  `CONCAT("https://${req.get(
                    "host"
                  )}/uploads/", category.image)`
                ),
                "image",
              ],
            ],
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
            attributes: [
              "id",
              [
                Sequelize.literal(
                  `CONCAT("https://${req.get(
                    "host"
                  )}/uploads/", productImages.image)`
                ),
                "image",
              ],
            ],
          },
          {
            model: OptionGroup,
            attributes: ["id", "name", "type"],
            include: { model: Option, attributes: ["id", "name", "value"] },
          },
          {
            model: User,
            attributes: [
              "id",
              "name",
              "email",
              "phone",
              [
                Sequelize.literal(
                  `CONCAT("https://${req.get("host")}/uploads/", user.image)`
                ),
                "image",
              ],
            ],
          },
          {
            model: Category,
            attributes: [
              "id",
              "name",
              [
                Sequelize.literal(
                  `CONCAT("https://${req.get(
                    "host"
                  )}/uploads/", category.image)`
                ),
                "image",
              ],
            ],
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
    console.log(error);
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
          attributes: [
            "id",
            [
              Sequelize.literal(
                `CONCAT("https://${req.get(
                  "host"
                )}/uploads/", productImages.image)`
              ),
              "image",
            ],
          ],
        },
        {
          model: OptionGroup,
          attributes: ["id", "name", "type"],
          include: { model: Option, attributes: ["id", "name", "value"] },
        },
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "phone",
            [
              Sequelize.literal(
                `CONCAT("https://${req.get("host")}/uploads/", user.image)`
              ),
              "image",
            ],
          ],
        },
        {
          model: Category,
          attributes: [
            "id",
            "name",
            [
              Sequelize.literal(
                `CONCAT("http://${req.get("host")}/uploads/", category.image)`
              ),
              "image",
            ],
          ],
        },
      ],
    });

    return res.status(200).json({ message: "success", product });
  } catch (error) {
    console.log(error);
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
          attributes: [
            "id",
            [
              Sequelize.literal(
                `CONCAT("http://${req.get(
                  "host"
                )}/uploads/", productImages.image)`
              ),
              "image",
            ],
          ],
        },
        {
          model: User,
          attributes: [
            "id",
            "name",
            [
              Sequelize.literal(
                `CONCAT("http://${req.get("host")}/uploads/", user.image)`
              ),
              "image",
            ],
          ],
        },
        {
          model: Category,
          attributes: [
            "id",
            "name",
            [
              Sequelize.literal(
                `CONCAT("http://${req.get("host")}/uploads/", category.image)`
              ),
              "image",
            ],
          ],
        },
      ],
    });

    await product.update(req.body);

    let imagesWithUrl = [];

    if (req.files.image) {
      const images = await ProductImage.bulkCreate(
        req.files.image?.map((file) => ({
          productId: product.id,
          image: file.filename,
        }))
      );

      imagesWithUrl = images.map((image) => {
        return {
          ...image.toJSON(),
          image: "http://" + req.get("host") + "/uploads/" + image.image,
        };
      });
    }

    return res.status(200).json({
      message: "success",
      product: {
        ...product.toJSON(),
        productImages: product.productImages.concat(imagesWithUrl),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);

    const vendorCategory = await VendorCategory.findOne({
      where: { categoryId: product.categoryId, userId: product.vendorId },
    });

    if (+vendorCategory.products_number === 1) {
      await VendorCategory.destroy({ where: { id: vendorCategory.id } });
    } else {
      vendorCategory.products_number = +vendorCategory.products_number - 1;
      await vendorCategory.save();
    }

    Product.destroy({ where: { id } }).then(() =>
      res.json({ message: "deleted" })
    );
  } catch (error) {
    console.log(error);
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

    const orders = 0;

    return res.status(200).json({ products, customers, orders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error" });
  }
};
