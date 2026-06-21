import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js"; // Pastikan di-import untuk mengunci fitur petugas
import upload from "../middleware/uploadMiddleware.js";

import {
    createLaporan,
    getMyDraftLaporan,
    updateDraftLaporan,
    submitLaporan,
    getMyLaporan,
    getPublicLaporan,
    uploadLaporanImages,
    getDetailLaporan,
    getLaporanTimeline,
    deleteDraftLaporan,
    getDetailLaporanPrivate,
    getMyDetailLaporan,
    createInternalComment,
    uploadProgressImages,
    getProgressImages,
    updateProgressDescription,
    deleteProgressImage,
    getInternalComments,
    deleteInternalComment,
    createPublicComment,
    getPublicComments,
    deletePublicComment,
    // Pastikan fungsi update status admin ini sudah di-export dari controller kamu:
    // updateStatusLaporan 
} from "../controllers/laporanController.js";

import { getAllKategori } from "../controllers/adminController.js";

import { hanyaPetugas } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/public/kategori", getAllKategori);
router.get("/", authMiddleware, getPublicLaporan);
router.get("/draft/me", authMiddleware, getMyDraftLaporan);
router.get("/me", authMiddleware, getMyLaporan);

router.post("/create", authMiddleware, upload.array("images", 5), createLaporan);

// PREFIX STATIS + PARAM
router.get("/me/:id", authMiddleware, getMyDetailLaporan);       // ← NAIK ke sini
router.get("/detail/:id", authMiddleware, roleMiddleware("admin", "superadmin"), getDetailLaporanPrivate);

// PATCH & POST & DELETE (tidak konflik dengan GET)
router.patch("/draft/:id", authMiddleware, updateDraftLaporan);
router.delete("/draft/:id", authMiddleware, deleteDraftLaporan);
router.patch("/submit/:id", authMiddleware, submitLaporan);
router.post("/upload-images/:id", authMiddleware, upload.array("images", 5), uploadLaporanImages);

// SUB-PATH DINAMIS
router.get("/:id/timeline", authMiddleware, getLaporanTimeline);
router.get("/:id/progress", authMiddleware, getProgressImages);
router.get("/:id/comment", getPublicComments);
router.get("/:id/internal-comment", authMiddleware, roleMiddleware("user", "admin", "superadmin"), getInternalComments);

router.post("/:id/internal-comment", authMiddleware, roleMiddleware("user", "admin", "superadmin"), createInternalComment);
router.post("/:id/progress", authMiddleware, hanyaPetugas, upload.array("image", 5), uploadProgressImages);
router.post("/:id/comment", authMiddleware, createPublicComment);

router.patch("/progress/:progressId", authMiddleware, hanyaPetugas, updateProgressDescription);

router.delete("/internal-comment/:commentId", authMiddleware, roleMiddleware("user", "admin", "superadmin"), deleteInternalComment);
router.delete("/comment/:commentId", authMiddleware, deletePublicComment);
router.delete("/progress-image/:imageId", authMiddleware, hanyaPetugas, deleteProgressImage);

// WILDCARD — WAJIB PALING BAWAH
router.get("/:id", authMiddleware, getDetailLaporan);

export default router;