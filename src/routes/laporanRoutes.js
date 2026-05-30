import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

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
    deleteDraftLaporan
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
    getLaporanTimeline
);

router.get(
    "/:id",
    getDetailLaporan
);

export default router;