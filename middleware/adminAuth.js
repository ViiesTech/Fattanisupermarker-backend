const JWT = require("jsonwebtoken");
const Users = require('../models/Users')
require("dotenv").config();

const AdminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"]

        if (!authHeader) return res.status(401).json({ success: false, message: "*Not authenticated." });

        const token = authHeader.split(" ")[1];
        const jwtSecret = process.env.JWT_SECRET_KEY
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not set in .env');
        }
        const decoded = JWT.verify(token, jwtSecret);

        const { _id, email } = decoded;

        const admin = await Users.findById(_id).select("-password")

        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

        if (admin.email !== email) return res.status(403).json({ success: false, message: "Access denied. Admin only." });

        req.admin = admin;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false, message: "Invalid or expired token", error: error.message
        });
    }
};

module.exports = AdminAuth
