import express from "express";
import {
    getUserDashboard,
    getAdminDashboard,
    getSuperAdminDashboard
} from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware, hanyaMasyarakat, hanyaPetugas } from "../middleware/roleMiddleware.js";

// ✅ Definisikan di sini, SETELAH roleMiddleware diimport
const hanyaSuperAdmin = roleMiddleware("superadmin");

const router = express.Router();

router.get("/user",       authMiddleware, hanyaMasyarakat, getUserDashboard);
router.get("/admin",      authMiddleware, hanyaPetugas,    getAdminDashboard);

// ✅ Ganti hanyaPetugas → hanyaSuperAdmin
router.get("/superadmin", authMiddleware, hanyaSuperAdmin, getSuperAdminDashboard);

export default router;