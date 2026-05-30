import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createAdmin,
    getAllLaporan,
    updateStatusLaporan,
    reviewLaporan,
    verifyLaporan,
    rejectLaporan
} from "../controllers/adminController.js";

const router = express.Router();

router.post(
    "/createAdmin",
    authMiddleware,
    roleMiddleware("superadmin"),
    createAdmin
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    getAllLaporan
);

router.patch(
    "/review/:id",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    reviewLaporan
);

router.patch(
    "/:id/verifikasi",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    verifyLaporan
);

router.patch(
    "/:id/tolak",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    rejectLaporan
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    updateStatusLaporan
);

export default router;