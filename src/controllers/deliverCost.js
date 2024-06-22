const Area = require("../models/area");
const User = require("../models/user");
const DeliverCost = require("../models/delivery_cost");

exports.createCosts = async (req, res) => {
    const { vendorId, costs } = req.body;
    try {
        const deliveryCosts = costs.map((cost) => {
            return { userId: vendorId, areaId: cost.area, cost: cost.cost };
        });

        const delivery_costs = await DeliverCost.bulkCreate(deliveryCosts);

        return res.status(201).json({ message: "success", delivery_costs });
    } catch (error) {
        console.error(error);
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
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.deleteOne = async (req, res) => {
    const { id } = req.params;

    DeliverCost.destroy({ where: { id } })
        .then(() => res.json({ message: "cost deleted" }))
        .catch((error) => res.status(400).json({ error }));
};
