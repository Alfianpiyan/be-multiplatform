import db from "../config/db.js";

export const getUserDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const [laporan] = await db.query(
            `
            SELECT
                -- ✅ Menggunakan SUM agar total_laporan hanya menghitung yang statusnya BUKAN draft
                SUM(status != 'draft') AS total_laporan,

                SUM(status = 'pending') AS pending,

                SUM(status = 'diperiksa') AS diperiksa,

                SUM(status = 'diverifikasi') AS diverifikasi,

                SUM(status = 'tindak_lanjut') AS tindak_lanjut,

                SUM(status = 'selesai') AS selesai

            FROM laporan

            WHERE user_id = ?
            `,
            [userId]
        );

        const [notifications] = await db.query(
            `
            SELECT COUNT(*) AS unread_notifications
            FROM notifications
            WHERE user_id = ?
            AND is_read = FALSE
            `,
            [userId]
        );

        // Menghindari nilai null jika user baru belum memiliki data laporan sama sekali
        const dataLaporan = laporan[0] ? {
            total_laporan: Number(laporan[0].total_laporan || 0),
            draft: Number(laporan[0].draft || 0),
            pending: Number(laporan[0].pending || 0),
            diperiksa: Number(laporan[0].diperiksa || 0),
            diverifikasi: Number(laporan[0].diverifikasi || 0),
            tindak_lanjut: Number(laporan[0].tindak_lanjut || 0),
            selesai: Number(laporan[0].selesai || 0),
        } : {
            total_laporan: 0, draft: 0, pending: 0, diperiksa: 0, diverifikasi: 0, tindak_lanjut: 0, selesai: 0
        };

        res.status(200).json({
            message: "Dashboard user berhasil diambil",
            data: {
                ...dataLaporan,
                unread_notifications: notifications[0]?.unread_notifications || 0
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const getAdminDashboard = async (req, res) => {
    try {

        const city = req.user.city;

        const [laporan] = await db.query(
            `
            SELECT
                COUNT(*) AS total_laporan,

                SUM(status = 'pending') AS pending,

                SUM(status = 'diperiksa') AS diperiksa,

                SUM(status = 'diverifikasi') AS diverifikasi,

                SUM(status = 'tindak_lanjut') AS tindak_lanjut,

                SUM(status = 'selesai') AS selesai

            FROM laporan

            WHERE city = ?
            `,
            [city]
        );

        const [notifications] = await db.query(
            `
            SELECT COUNT(*) AS unread_notifications
            FROM notifications
            WHERE user_id = ?
            AND is_read = FALSE
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Dashboard admin berhasil diambil",
            data: {
                ...laporan[0],
                unread_notifications:
                    notifications[0].unread_notifications
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const getSuperAdminDashboard = async (req, res) => {
    try {

        const [users] = await db.query(
            `
            SELECT COUNT(*) AS total_users
            FROM users
            WHERE role = 'user'
            `
        );

        const [admins] = await db.query(
            `
            SELECT COUNT(*) AS total_admins
            FROM users
            WHERE role = 'admin'
            `
        );

        const [laporan] = await db.query(
            `
            SELECT
                COUNT(*) AS total_laporan,

                SUM(status = 'pending') AS pending,

                SUM(status = 'diperiksa') AS diperiksa,

                SUM(status = 'diverifikasi') AS diverifikasi,

                SUM(status = 'tindak_lanjut') AS tindak_lanjut,

                SUM(status = 'selesai') AS selesai

            FROM laporan
            `
        );

        res.status(200).json({
            message: "Dashboard superadmin berhasil diambil",
            data: {
                total_users:
                    users[0].total_users,

                total_admins:
                    admins[0].total_admins,

                ...laporan[0]
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};