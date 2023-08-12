const OptionGroup = require("../models/optionGroup");
const Option = require("../models/option");

exports.createGroup = async (req, res) => {
  const { productId, name, options } = req.body;
  try {
    const group = await OptionGroup.create({
      name,
      productId,
    });

    const groupOptions = await Option.bulkCreate(
      options.map((option) => {
        return {
          optionsGroupId: group.id,
          name: option.name,
          value: option.value,
        };
      })
    );

    return res.status(200).json({
      message: "success",
      group: {
        id: group.id,
        name,
        options: groupOptions,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "internal server error!" });
  }
};

exports.editGroup = async (req, res) => {
  const id = req.params.id;
  const { name, options } = req.body;
  try {
    const group = await OptionGroup.findByPk(id, { include: Option });

    await group.update({ name });

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
