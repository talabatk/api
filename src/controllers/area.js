const Area = require("../models/area");

exports.createArea = async (req, res, next) => {
    const { name } = req.body;

    try {
        const area = await Area.create({
            name
        });

        return res.status(201).json({ message: "area created!", area });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAll = async (req, res, next) => {
    Area.findAll()
        .then((areas) => {
            return res.status(200).json({ results: areas });
        })
        .catch((error) => res.status(400).json({ error }));
};

exports.getOne = async (req, res) => {
    const { id } = req.params;

    Area.findByPk(id)
        .then((area) => res.json(area))
        .catch((error) => res.status(400).json({ error }));
};

exports.editOne = async (req, res) => {
    const { id } = req.params;

    try {
        const area = await Area.findByPk(id);

        await area.update(req.body);

        return res.status(200).json(area);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.deleteOne = async (req, res, next) => {
    const { id } = req.params;

    Area.destroy({ where: { id } })
        .then(() => res.json({ message: "area deleted" }))
        .catch((error) => res.status(400).json({ error }));
};
