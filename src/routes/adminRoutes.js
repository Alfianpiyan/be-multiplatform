import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

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
    deleteKategori,
    getAllAdmins
} from "../controllers/adminController.js";

const router = express.Router();

// 🌟 Duplikat route "/admins" sudah dihapus (sebelumnya ke-define 2x persis sama)
router.get(
    "/admins",
    authMiddleware,
    roleMiddleware("superadmin"),
    getAllAdmins
);

router.post(
    "/createAdmin",
    authMiddleware,
    roleMiddleware("superadmin"),
    createAdmin
);

router.get(
    "/semua",
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
    roleMiddleware("admin"),
    verifyLaporan
);

router.patch(
    "/:id/tolak",
    authMiddleware,
    roleMiddleware("admin"),
    rejectLaporan
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleMiddleware("admin"),
    updateStatusLaporan
);

router.get(
    "/public/kategori",
    getAllKategori
);

router.post(
    "/kategori",
    authMiddleware,
    roleMiddleware("admin"),
    createKategori
);

router.patch(
    "/kategori/:id",
    authMiddleware,
    roleMiddleware("admin"),
    updateKategori
);

router.delete(
    "/kategori/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteKategori
);

export default router; 