const OptionGroup = require("../models/optionGroup");
const Option = require("../models/option");
const Logger = require("../util/logger");

exports.createOrUpdateGroup = async (req, res) => {
  try {
    // Parse incoming JSON

    const groups = JSON.parse(req.body.groupsData || "[]");
    const products = JSON.parse(req.body.products || "[]");

    const groupsList = [];
    const options = [];
    const updatedGroups = [];

    // 1. Attach images from req.files to corresponding options
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // Example: fieldname = "groups[0][options][1][image]"
        const match = file.fieldname.match(
          /groups\[(\d+)\]\[options\]\[(\d+)\]\[image\]/
        );
        if (match) {
          const groupIndex = parseInt(match[1], 10);
          const optionIndex = parseInt(match[2], 10);
          if (groups[groupIndex] && groups[groupIndex].options[optionIndex]) {
            groups[groupIndex].options[optionIndex].image = file.location;
          }
        }
      });
    }

    // 2. Process groups & products
    for (const group of groups) {
      for (const product of products) {
        const existingGroup = await OptionGroup.findOne({
          where: { productId: product, id: group?.id || null },
        });

        if (existingGroup) {
          await existingGroup.update({
            name: group.name,
            type: group.type,
          });
          updatedGroups.push({
            ...existingGroup.toJSON(),
            options: group.options,
          });
        } else {
          groupsList.push({
            productId: product,
            name: group.name,
            type: group.type,
            options: group.options,
          });
        }
      }
    }

    // 3. Bulk create new groups
    const createdGroups = await OptionGroup.bulkCreate(groupsList, {
      returning: true,
    });
    const newGroups = createdGroups.map((group, i) => ({
      ...group.toJSON(),
      options: groupsList[i].options,
    }));

    const allGroups = [...newGroups, ...updatedGroups];

    // 4. Process options
    for (const group of allGroups) {
      const groupOptions = group.options || [];
      for (const option of groupOptions) {
        const existingOption = await Option.findOne({
          where: { optionsGroupId: group.id, id: option.id || null },
        });

        if (existingOption) {
          await existingOption.update({
            name: option.name,
            value: option.value,
            image: option.image || existingOption.image,
          });
        } else {
          options.push({
            name: option.name,
            value: option.value,
            image: option.image || null,
            optionsGroupId: group.id,
          });
        }
      }
    }

    const optionsRes = await Option.bulkCreate(options, { returning: true });

    return res.status(200).json({
      message: "success",
      groups: allGroups.map((group) => {
        return {
          group,
          options: [
            ...optionsRes.filter((opt) => opt.optionsGroupId === group.id),
            ...(group.options || []).filter((opt) => opt.id), // keep updated ones too
          ],
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "internal server error!" });
  }
};

exports.addGroup = async (req, res) => {
  const products = req.body.products;
  const group = req.body.group;

  try {
    const groupsList = [];
    for (const product of products) {
      groupsList.push({
        productId: product,
        name: group.name,
        type: group.type,
      });
    }
    const createdGroups = await OptionGroup.bulkCreate(groupsList, {
      returning: true, // Ensure created entries are returned
    });

    return res.status(200).json({
      message: "success",
      groups: createdGroups,
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error!" });
  }
};

exports.addOption = async (req, res) => {
  const { name, value, groupId } = req.body;
  try {
    console.log(req.files);

    const option = await Option.create({
      name: name,
      value: value,
      optionsGroupId: groupId,
      image: req.files.image ? req.files.image[0].location : null,
    });

    return res.status(200).json({
      message: "success",
      option,
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

    if (req.files.image) {
      await option.update({
        image: req.files.image ? req.files.image[0].location : null,
      });
    }
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
