const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//models===============================
const User = require("../models/user");
const Delivery = require("../models/delivery");

//generate token=======================
const generateToken = (userId) => {
    const token = jwt.sign({ userId }, "talabatek2309288/k_ss-jdls88", {
        expiresIn: "5400h"
    });
    return token;
};

exports.login = async (req, res) => {
    const { key, password } = req.body;

    try {
        let user = null;

        if (key.includes("@")) {
            user = await User.findOne({
                where: { email: key, role: "delivery" },
                include: [Delivery]
            });
        } else {
            user = await User.findOne({
                where: { phone: key, role: "delivery" },
                include: [Delivery]
            });
        }

        if (!user) {
            return res.status(404).json({ message: "user with this email not exist" });
        }

        if (!user.delivery) {
            return res.status(401).json({ error: "you are not delivery" });
        }

        const isEqual = await bcrypt.compare(password, user.password);

        if (!isEqual) {
            return res.status(401).json({ error: "password is not correct" });
        }

        const token = generateToken(user.id);

        user.token = token;

        if (req.body.fcm) {
            user.fcm = req.body.fcm;
        }

        await user.save();

        return res.status(200).json({
            message: "login success",
            user: {
                id: user.id,
                name: user.name,
                fcm: user.fcm,
                email: user.email,
                phone: user.phone,
                role: user.role,
                image: user.image ? `http://${req.get("host")}/uploads/${user.image}` : null,
                token
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.createDelivery = async (req, res) => {
    const { name, email, phone, fcm, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.status(400).json({ error: "passwords not matched" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            phone,
            fcm,
            image: req.files.image ? req.files.image[0].filename : null,
            role: "delivery",
            password: hashedPassword
        });

        const delivery = await Delivery.create({
            userId: user.id
        });

        const token = generateToken(user.id);

        user.token = token;

        await user.save();

        return res.status(201).json({
            message: "delivery created",
            user: {
                id: user.id,
                name,
                email,
                phone,
                fcm,
                image: req.files.image
                    ? `http://${req.get("host")}/uploads/${req.files.image[0].filename}`
                    : null,
                token,
                role: "delivery"
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.getAllDeliveries = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: "delivery"
            },
            include: [Delivery],
            attributes: { exclude: ["password"] }
        });

        const results = users.map((user) => {
            return {
                ...user.toJSON(),
                image: user.image ? `http://${req.get("host")}/uploads/${user.image}` : null
            };
        });

        const count = await User.count({
            where: {
                role: "delivery"
            }
        }); // Get total number of admins

        return res.status(200).json({ count: count, results: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
