import express from "express";

import {authMiddleware} from "../middleware/authMiddleware.js";

import cloudinary from "../config/cloudinary.js";

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
    deletePublicComment
} from "../controllers/laporanController.js";

const router = express.Router();

router.get(
    "/",
    getPublicLaporan
);

router.post(
    "/create",
    authMiddleware,
    upload.array("images", 5),
    createLaporan
);

router.get(
    "/draft/me",
    authMiddleware,
    getMyDraftLaporan
);

router.patch(
    "/draft/:id",
    authMiddleware,
    updateDraftLaporan
);

router.delete(
    "/draft/:id",
    authMiddleware,
    deleteDraftLaporan
);

router.patch(
    "/submit/:id",
    authMiddleware,
    submitLaporan
);

router.get(
    "/me",
    authMiddleware,
    getMyLaporan
);

router.get(
    "/:id/timeline",
    authMiddleware,
    getLaporanTimeline
);

router.post(
    "/:id/internal-comment",
    authMiddleware,
    createInternalComment
);

router.get(
    "/:id/internal-comment",
    authMiddleware,
    getInternalComments
);

router.delete(
    "/internal-comment/:commentId",
    authMiddleware,
    deleteInternalComment
);
router.post(
    "/:id/progress",
    authMiddleware,
    upload.array("images", 5),
    uploadProgressImages
);

router.get(
    "/:id/progress",
    authMiddleware,
    getProgressImages
);

router.patch(
    "/:id/progress",
    authMiddleware,
    updateProgressDescription
);

router.delete(
    "/progress-image/:imageId",
    authMiddleware,
    deleteProgressImage
);

router.post(
    "/:id/comment",
    authMiddleware,
    createPublicComment
);

router.get(
    "/:id/comment",
    getPublicComments
);

router.delete(
    "/comment/:commentId",
    authMiddleware,
    deletePublicComment
);

router.get(
    "/detail/:id",
    authMiddleware,
    getDetailLaporanPrivate
);
router.get(
    "/me/:id",
    authMiddleware,
    getMyDetailLaporan
);


router.get(
    "/:id",
    getDetailLaporan
);

export default router;