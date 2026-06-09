import express from "express";

import {authMiddleware} from "../middleware/authMiddleware.js";

import {
    getMyNotifications,
    getUnreadNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications
} from "../controllers/notificationController.js";
const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getMyNotifications
);

router.get(
    "/unread",
    authMiddleware,
    getUnreadNotifications
);

router.get(
    "/unread/count",
    authMiddleware,
    getUnreadNotificationCount
);

router.patch(
    "/:id/read",
    authMiddleware,
    markNotificationAsRead
);

router.patch(
    "/read-all",
    authMiddleware,
    markAllNotificationsAsRead
);

router.delete(
    "/:id",
    authMiddleware,
    deleteNotification
);

router.delete(
    "/",
    authMiddleware,
    deleteAllNotifications
);

export default router;