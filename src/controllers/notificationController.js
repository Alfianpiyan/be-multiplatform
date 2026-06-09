import db from "../config/db.js";

export const getMyNotifications = async (req, res) => {

    try {

        const [notifications] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Notifikasi berhasil diambil",
            data: notifications
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getUnreadNotifications = async (req, res) => {

    try {

        const [notifications] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id = ?
            AND is_read = FALSE
            ORDER BY created_at DESC
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Notifikasi belum dibaca berhasil diambil",
            data: notifications
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getUnreadNotificationCount = async (req, res) => {

    try {

        const [result] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE user_id = ?
            AND is_read = FALSE
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Jumlah notifikasi belum dibaca",
            data: {
                total: result[0].total
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const markNotificationAsRead = async (req, res) => {

    try {

        const { id } = req.params;

        const [notification] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE id = ?
            `,
            [id]
        );

        if (notification.length === 0) {
            return res.status(404).json({
                message: "Notifikasi tidak ditemukan"
            });
        }

        if (notification[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = ?
            `,
            [id]
        );

        res.status(200).json({
            message: "Notifikasi ditandai sudah dibaca"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const markAllNotificationsAsRead = async (req, res) => {

    try {

        await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Semua notifikasi telah dibaca"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const deleteNotification = async (req, res) => {

    try {

        const { id } = req.params;

        const [notification] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE id = ?
            `,
            [id]
        );

        if (notification.length === 0) {
            return res.status(404).json({
                message: "Notifikasi tidak ditemukan"
            });
        }

        if (notification[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        await db.query(
            `
            DELETE FROM notifications
            WHERE id = ?
            `,
            [id]
        );

        res.status(200).json({
            message: "Notifikasi berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const deleteAllNotifications = async (req, res) => {

    try {

        await db.query(
            `
            DELETE FROM notifications
            WHERE user_id = ?
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Semua notifikasi berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};