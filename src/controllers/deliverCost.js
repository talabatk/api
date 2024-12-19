const Area = require("../models/area");
const User = require("../models/user");
const DeliverCost = require("../models/delivery_cost");
const Logger = require("../util/logger");

exports.createOrUpdateCosts = async (req, res) => {
  const { vendorId, costs } = req.body;

  try {
    const results = await Promise.all(
      costs.map(async (cost) => {
        const existingCost = await DeliverCost.findOne({
          where: { userId: vendorId, areaId: cost.area },
        });

        if (existingCost) {
          // Update existing cost
          return await existingCost.update({ cost: cost.cost });
        } else {
          // Create new cost
          return await DeliverCost.create({
            userId: vendorId,
            areaId: cost.area,
            cost: cost.cost,
          });
        }
      })
    );

    return res.status(200).json({ message: "success", results });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.editOne = async (req, res) => {
  const { id } = req.params;

  try {
    const cost = await DeliverCost.findByPk(id);

    await cost.update(req.body);

    return res.status(200).json(cost);
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
};

exports.deleteOne = async (req, res) => {
  const { id } = req.params;

  DeliverCost.destroy({ where: { id } })
    .then(() => res.json({ message: "cost deleted" }))
    .catch((error) => res.status(400).json({ error }));
};
