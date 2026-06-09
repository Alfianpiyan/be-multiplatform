import express from "express";

import {authMiddleware} from "../middleware/authMiddleware.js";
import {roleMiddleware} from "../middleware/roleMiddleware.js";

import {
    createAdmin,
    getAllLaporan,
    updateStatusLaporan,
    searchLaporan,
    reviewLaporan,
    verifyLaporan,
    rejectLaporan,
    createKategori,
    getAllKategori,
    updateKategori,
    deleteKategori
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

router.get(
    "/search",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    searchLaporan
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

router.get(
    "/kategori",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    getAllKategori
);

router.post(
    "/kategori",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    createKategori
);

router.patch(
    "/kategori/:id",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    updateKategori
);

router.delete(
    "/kategori/:id",
    authMiddleware,
    roleMiddleware("superadmin"),
    deleteKategori
);

export default router;