import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import { authMiddleware } from "./middleware/authMiddleware.js";
import { roleMiddleware } from "./middleware/roleMiddleware.js";
import { hanyaPetugas } from "./middleware/roleMiddleware.js";

import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

// ==================== PERBAIKAN CORS DI SINI ====================
const allowedOrigins = [
    "http://localhost:3000",
    "https://curler-magenta-regroup.ngrok-free.dev" // Taruh url ngrok backend Anda di sini jika diperlukan
];

app.use(cors({
    origin: function (origin, callback) {
        // Izinkan request tanpa origin (seperti dari Postman, mobile apps, atau server-to-server)
        if (!origin) return callback(null, true);
        
        // Izinkan jika terdaftar di array, ATAU merupakan subdomain dari ngrok-free.dev
        if (allowedOrigins.indexOf(origin) !== -1 || (origin.startsWith("https://") && origin.endsWith(".ngrok-free.dev"))) {
            return callback(null, true);
        } else {
            return callback(new Error("Blocked by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
}));
// ================================================================

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend LaporYuk Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/laporan", adminRoutes);


app.use("/api/notifications", notificationRoutes);

app.get(
    "/api/profile",
    authMiddleware,
    (req, res) => {
        res.json({
            message: "Access granted",
            user: req.user
        });
    }
);

app.get("/api/admin-check", authMiddleware, hanyaPetugas, (req, res) => {
    res.json({ message: "Selamat Datang di Halaman Internal" });
});

app.get(
    "/api",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    (req, res) => {
        res.json({
            message: "Welcome Admin"
        });
    }
);

export default app;