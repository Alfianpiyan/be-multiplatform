import express from "express";

import {
    getUserDashboard,
    getAdminDashboard,
    getSuperAdminDashboard
} from "../controllers/dashboardController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
    "/user",
    authMiddleware,
    roleMiddleware("user"),
    getUserDashboard
);

router.get(
    "/admin",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminDashboard
);

router.get(
    "/superadmin",
    authMiddleware,
    roleMiddleware("superadmin"),
    getSuperAdminDashboard
);

export default router;