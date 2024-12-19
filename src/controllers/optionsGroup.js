const OptionGroup = require("../models/optionGroup");
const Option = require("../models/option");
const Logger = require("../util/logger");

exports.createOrUpdateGroup = async (req, res) => {
  const { products, groups } = req.body;

  try {
    const groupsList = [];
    const options = [];
    const updatedGroups = [];

    // Process groups and products
    for (const group of groups) {
      for (const product of products) {
        // Check if group exists for this product
        const existingGroup = await OptionGroup.findOne({
          where: { productId: product, id: group.id },
        });

        if (existingGroup) {
          // Update the existing group
          await existingGroup.update(group);
          updatedGroups.push({
            ...existingGroup.toJSON(),
            options: group.options,
          });
        } else {
          // Add to the list of new groups to create
          groupsList.push({
            productId: product,
            name: group.name,
            type: group.type,
            options: group.options,
          });
        }
      }
    }

    // Bulk create new groups
    const createdGroups = await OptionGroup.bulkCreate(groupsList, {
      returning: true, // Ensure created entries are returned
    });
    const newGroups = createdGroups.map((group, index) => {
      return { ...group.toJSON(), options: groupsList[index].options };
    });
    // Combine created and updated groups
    const allGroups = [...newGroups, ...updatedGroups];

    // Process options for each group
    for (const group of allGroups) {
      const groupOptions = group.options || [];
      for (const option of groupOptions) {
        // Check if option exists
        const existingOption = await Option.findOne({
          where: { optionsGroupId: group.id, id: option.id },
        });

        if (existingOption) {
          // Update existing option
          await existingOption.update(option);
        } else {
          // Add to options list for bulk creation
          options.push({
            name: option.name,
            value: option.value,
            optionsGroupId: group.id,
          });
        }
      }
    }

    // // Bulk create new options
    const optionsRes = await Option.bulkCreate(options, { returning: true });

    return res.status(200).json({
      message: "success",
      groups: allGroups.map((group) => {
        return {
          group,
          options: optionsRes.filter(
            (option) => option.optionsGroupId === group.id
          ),
        };
      }),
    });
  } catch (error) {
    Logger.error(error);
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
    Logger.error(error);
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
    Logger.error(error);
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
