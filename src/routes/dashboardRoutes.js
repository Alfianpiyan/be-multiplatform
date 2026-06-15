import express from "express";

import {
    getUserDashboard,
    getAdminDashboard,
    getSuperAdminDashboard
} from "../controllers/dashboardController.js";

import {hanyaMasyarakat, hanyaPetugas} from "../middleware/roleMiddleware.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Menggunakan fungsi pembantu, string nama role tersembunyi dengan aman!
router.get("/user", authMiddleware, hanyaMasyarakat, getUserDashboard);
router.get("/admin", authMiddleware, hanyaPetugas, getAdminDashboard);
router.get("/superadmin", authMiddleware, hanyaPetugas, getSuperAdminDashboard);
export default router;