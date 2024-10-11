const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Logger = require("../util/logger");

//models===================
const User = require("../models/user");
const Admin = require("../models/admin");
const AdminRole = require("../models/adminRole");

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
                where: { email: key, role: "admin" },
                include: [{ model: Admin, include: AdminRole }]
            });
        } else {
            user = await User.findOne({
                where: { phone: key, role: "admin" },
                include: [{ model: Admin, include: AdminRole }]
            });
        }

        if (!user) {
            return res.status(404).json({ message: "user with this email not exist" });
        }

        if (!user.admin) {
            return res.status(401).json({ error: "you are not admin" });
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
                super_admin: user.admin.super_admin,
                image: user.image ? user.image : null,
                roles: !user.admin.super_admin ? user.admin.adminRole : null,
                token
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.createAdmin = async (req, res) => {
    const { name, email, phone, fcm, password, confirm_password, roles, super_admin } = req.body;

    if (password !== confirm_password) {
        return res.status(400).json({ error: "passwords not matched" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            phone,
            image: req.files.image ? req.files.image[0].location : null,
            fcm,
            role: "admin",
            password: hashedPassword
        });

        const admin = await Admin.create({
            super_admin: !!super_admin,
            userId: user.id
        });

        let adminRoles = null;

        if (!super_admin) {
            adminRoles = await AdminRole.create({
                ...roles,
                adminId: admin.id
            });
        }

        const token = generateToken(user.id);

        user.token = token;

        await user.save();

        return res.status(201).json({
            message: "admin created",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image ? user.image : null,
                phone,
                fcm: user.fcm,
                super_admin: admin.super_admin,
                role: "admin",
                roles: !admin.super_admin ? adminRoles : null,
                token
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "internal server error" });
    }
};

exports.getAllAdmins = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: "admin"
            },
            include: [{ model: Admin, include: AdminRole }],
            attributes: { exclude: ["password"] }
        });

        const results = users.map((user) => {
            return {
                ...user.toJSON(),
                image: user.image ? user.image : null
            };
        });

        const count = await User.count({
            where: {
                role: "admin"
            }
        }); // Get total number of admins

        return res.status(200).json({ count: count, results: results });
    } catch (error) {
        Logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateRoles = async (req, res) => {
    const { userId } = req.query;
    try {
        const admin = await Admin.findOne({
            where: { userId }
        });

        await AdminRole.update(req.body, { where: { adminId: admin.id } });

        return res.status(200).json({ message: "roles updated successfully" });
    } catch (error) {
        Logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.editAdmin = async (req, res) => {
    const { id } = req.body;

    try {
        let admin = null;

        if (id) {
            admin = await User.findByPk(id, {
                include: [Admin]
            });
        } else {
            admin = await User.findOne({
                where: { token },
                include: [Admin]
            });
        }

        if (!admin) {
            return res.status(404).json({ message: "notfound" });
        }

        // Check if email or phone exists and belongs to someone else
        const { email, phone } = req.body;
        if (email && email !== admin.email && (await User.findOne({ where: { email } }))) {
            return res.status(400).json({ message: "email already exist" });
        }
        if (phone && phone !== admin.phone && (await User.findOne({ where: { phone } }))) {
            return res.status(400).json({ message: "phone number already exist" });
        }

        const updatedAdmin = await admin.update(req.body);

        if (req.files.image) {
            const updateUser = await admin.update({
                image: req.files.image[0].location
            });
        }

        return res.status(200).json(updatedAdmin);
    } catch (error) {
        Logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
