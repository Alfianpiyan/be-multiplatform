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

// ========================================================
// 1. RUTE STATIS / DEFINISIKAN JALUR PASTI (Wajib di Atas)
// ========================================================

// Jalur penuhnya menjadi: GET /api/laporan/public/kategori
router.get(
    "/public/kategori",
    getAllKategori
);

// GET: /api/laporan
router.get(
    "/",
    authMiddleware,
    getPublicLaporan
);

// POST: /api/laporan/create
router.post(
    "/create",
    authMiddleware,
    upload.array("images", 5),
    createLaporan
);

// GET: /api/laporan/draft/me
router.get(
    "/draft/me",
    authMiddleware,
    getMyDraftLaporan
);

// GET: /api/laporan/me
router.get(
    "/me",
    authMiddleware,
    getMyLaporan
);


// ========================================================
// 2. RUTE DENGAN PARAMETER KHUSUS / SUB-PATH (Aman di Tengah)
// ========================================================

// PATCH: /api/laporan/draft/:id
router.patch(
    "/draft/:id",
    authMiddleware,
    updateDraftLaporan
);

// DELETE: /api/laporan/draft/:id
router.delete(
    "/draft/:id",
    authMiddleware,
    deleteDraftLaporan
);

// PATCH: /api/laporan/submit/:id
router.patch(
    "/submit/:id",
    authMiddleware,
    submitLaporan
);

// POST: /api/laporan/upload-images/:id
router.post(
    "/upload-images/:id",
    authMiddleware,
    upload.array("images", 5),
    uploadLaporanImages
);

// GET: /api/laporan/:id/timeline
router.get(
    "/:id/timeline",
    authMiddleware,
    getLaporanTimeline
);

// --- SEKTOR KOMENTAR INTERNAL & PROGRESS (Hanya Admin / Superadmin) ---

// POST: /api/laporan/:id/internal-comment
router.post(
    "/:id/internal-comment",
    authMiddleware,
    roleMiddleware("user","admin", "superadmin"), // Di-lock agar user biasa tidak bisa kirim
    createInternalComment
);

// GET: /api/laporan/:id/internal-comment
router.get(
    "/:id/internal-comment",
    authMiddleware,
    roleMiddleware("user","admin", "superadmin"), // Di-lock agar user biasa tidak bisa intip
    getInternalComments
);

// DELETE: /api/laporan/internal-comment/:commentId
router.delete(
    "/internal-comment/:commentId",
    authMiddleware,
    roleMiddleware("user","admin", "superadmin"),
    deleteInternalComment
);

// POST: /api/laporan/:id/progress
router.post("/:id/progress", authMiddleware, hanyaPetugas, upload.array("image", 5), uploadProgressImages);
router.patch("/progress/:progressId", authMiddleware, hanyaPetugas, updateProgressDescription);
router.delete("/progress-image/:imageId", authMiddleware, hanyaPetugas, deleteProgressImage);

/* Silakan buka baris ini jika kamu memiliki fungsi update status (misal: pending -> selesai)
  PUT: /api/laporan/:id/status
  router.put(
      "/:id/status",
      authMiddleware,
      roleMiddleware("admin", "superadmin"),
      updateStatusLaporan
  );
*/

// --- SEKTOR FITUR UMUM / PUBLIK ---

// GET: /api/laporan/:id/progress (Bisa dilihat siapa saja untuk transparansi kerja)
router.get(
    "/:id/progress",
    authMiddleware,
    getProgressImages
);

// POST: /api/laporan/:id/comment
router.post(
    "/:id/comment",
    authMiddleware,
    createPublicComment
);

// GET: /api/laporan/:id/comment
router.get(
    "/:id/comment",
    getPublicComments
);

// DELETE: /api/laporan/comment/:commentId
router.delete(
    "/comment/:commentId",
    authMiddleware,
    deletePublicComment
);

// --- SEKTOR AMBIL DATA DETAIL ---

// GET: /api/laporan/detail/:id (Fungsi privat dashboard internal petugas)
router.get(
    "/detail/:id",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    getDetailLaporanPrivate
);

// GET: /api/laporan/me/:id (Fungsi user mengecek detail aduannya sendiri)
router.get(
    "/me/:id",
    authMiddleware,
    getMyDetailLaporan
);


// ========================================================
// 3. RUTE WILDCARD / DINAMIS TOTAL (MUTLAK DI PALING BAWAH)
// ========================================================

// GET: /api/laporan/:id
router.get(
    "/:id",
     authMiddleware,
    getDetailLaporan,
    // Tetap butuh auth untuk melihat detail, karena ada data sensitif yang hanya boleh dilihat oleh pelapor dan petugas terkait
);

export default router;