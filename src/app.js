import express from "express";

import authRoutes from "./routes/authRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import authMiddleware from "./middleware/authMiddleware.js";
import roleMiddleware from "./middleware/roleMiddleware.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend LaporYuk Running");
});

app.use("/api/auth", authRoutes);

app.use("/api/laporan", laporanRoutes);

app.use("/api/laporan", adminRoutes);

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