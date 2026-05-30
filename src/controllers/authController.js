import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {

    try {

        const {
            userName,
            email,
            password,
            telepon,
            alamat
        } = req.body;

        const [checkEmail] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (checkEmail.length > 0) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users 
            (userName, email, password, telepon, alamat)
            VALUES (?, ?, ?, ?, ?)`,
            [
                userName,
                email,
                hashedPassword,
                telepon,
                alamat
            ]
        );

        res.status(201).json({
            message: "Register success"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Wrong password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login success",
            token,
            user: {
                id: user.id,
                userName: user.userName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};