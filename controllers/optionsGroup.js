const OptionGroup = require("../models/optionGroup");
const Option = require("../models/option");
const ProductGroup = require("../models/productGroup");
const Product = require("../models/product");

exports.createGroup = async (req, res) => {
  const { products, vendorId, groups } = req.body;

  try {
    const groupsList = groups.map((group) => ({
      name: group.name,
      type: group.type,
      vendorId,
    }));

    const groupsRes = await OptionGroup.bulkCreate(groupsList);

    const productGroups = [];
    const options = [];

    if (vendorId) {
      const vendorProducts = await Product.findAll({ where: { vendorId } });

      groupsRes.forEach((group) => {
        vendorProducts.forEach((product) => {
          productGroups.push({
            productId: product.id,
            optionsGroupId: group.id,
          });
        });
      });
    } else {
      groupsRes.forEach((group) => {
        products.forEach((productId) => {
          productGroups.push({
            productId,
            optionsGroupId: group.id,
          });
        });
      });
    }

    await ProductGroup.bulkCreate(productGroups);

    groups.forEach((group, i) => {
      group.options.forEach((option) => {
        options.push({
          name: option.name,
          value: option.value,
          optionsGroupId: groupsRes[i].id,
        });
      });
    });

    const optionsRes = await Option.bulkCreate(options);

    const responseGroups = groupsRes.map((group) => ({
      ...group.toJSON(),
      options: optionsRes.filter(
        (option) => option.optionsGroupId === group.id
      ),
    }));

    return res.status(200).json({
      message: "success",
      groups: responseGroups,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error!" });
  }
};

exports.editGroup = async (req, res) => {
  const id = req.params.id;
  const { name, type, options } = req.body;

  try {
    const group = await OptionGroup.findByPk(id, { include: Option });

    await group.update({ name, type: type ? type : group.type });

    let groupOptions = [];

    if (options) {
      groupOptions = await Option.bulkCreate(
        options.map((option) => {
          return {
            optionsGroupId: group.id,
            name: option.name,
            value: option.value,
          };
        })
      );
    }

    return res.status(200).json({
      message: "success",
      group: {
        ...group.toJSON(),
        options: group.options.concat(groupOptions),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error!" });
  }
};

exports.editOption = async (req, res) => {
  const id = req.params.id;

  try {
    const option = await Option.findByPk(id);

    await option.update(req.body);

    return res.status(200).json({
      message: "success",
      option,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error!" });
  }
};

exports.removeGroup = async (req, res) => {
  const { id } = req.params;

  OptionGroup.destroy({ where: { id } })
    .then(() => res.json({ message: "group deleted" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.removeOption = async (req, res) => {
  const { id } = req.params;

  Option.destroy({ where: { id } })
    .then(() => res.json({ message: "option deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
