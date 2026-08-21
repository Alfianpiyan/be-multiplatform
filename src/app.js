import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { authMiddleware } from "./middleware/authMiddleware.js";
import { roleMiddleware, hanyaPetugas } from "./middleware/roleMiddleware.js";

const app = express();

app.use(cors({
    origin: '*', 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
}));


app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
    res.send("Backend LaporYuk Running Successfully");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.use("/api/laporan", adminRoutes);
app.use("/api/laporan", laporanRoutes);

app.use("/api/notifications", notificationRoutes);

app.get("/api/profile", authMiddleware, (req, res) => {
    res.json({
        message: "Access granted",
        user: req.user
    });
});

app.get("/api/admin-check", authMiddleware, hanyaPetugas, (req, res) => {
    res.json({ message: "Selamat Datang di Halaman Internal" });
});

app.get("/api/admin-only", authMiddleware, roleMiddleware("admin", "superadmin"), (req, res) => {
    res.json({ message: "Welcome Admin" });
});

export default app;