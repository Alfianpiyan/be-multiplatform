import db from "../config/db.js";
import bcrypt from "bcrypt";

export const createAdmin = async (req, res) => {

    try {

        const {
            userName,
            email,
            password,
            role
        } = req.body;

        if (
            role !== "admin" &&
            role !== "superadmin"
        ) {
            return res.status(400).json({
                message: "Role tidak valid"
            });
        }

        const [existingUser] = await db.query(
            `
            SELECT * FROM users
            WHERE email = ?
            `,
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                message: "Email sudah digunakan"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        await db.query(
            `
            INSERT INTO users
            (
                userName,
                email,
                password,
                role
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                userName,
                email,
                hashedPassword,
                role
            ]
        );

        res.status(201).json({
            message: `${role} berhasil dibuat`
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getAllLaporan = async (req, res) => {

    try {

        const [laporan] = await db.query(
            `
            SELECT
                laporan.id,
                laporan.title,
                laporan.description,
                laporan.status,
                laporan.priority,
                laporan.visibility,
                laporan.created_at,

                users.userName,

                kategori.kategori

            FROM laporan

            JOIN users
                ON laporan.user_id = users.id

            LEFT JOIN kategori
                ON laporan.kategori_id = kategori.id

            WHERE laporan.status != 'draft'

            ORDER BY laporan.created_at DESC
            `
        );

        res.status(200).json({
            message: "Semua laporan berhasil diambil",
            data: laporan
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const updateStatusLaporan = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            status,
            alasan_penolakan
        } = req.body;

        const allowedStatus = [
            "diperiksa",
            "diverifikasi",
            "ditolak",
            "tindak_lanjut",
            "selesai"
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Status tidak valid"
            });
        }

        const [laporan] = await db.query(
            `
            SELECT *
            FROM laporan
            WHERE id = ?
            `,
            [id]
        );

        if (laporan.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        const oldStatus = laporan[0].status;

        let rejected_at = null;
        let verified_at = null;

        if (status === "ditolak") {
            rejected_at = new Date();
        }

        if (status === "diverifikasi") {
            verified_at = new Date();
        }

        await db.query(
            `
            UPDATE laporan
            SET
                status = ?,
                visibility = ?,
                alasan_penolakan = ?,
                rejected_at = ?,
                verified_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                status,

                status === "selesai"
                    ? "public"
                    : "private",

                alasan_penolakan || null,
                rejected_at,
                verified_at,
                id
            ]
        );

        await db.query(
            `
            INSERT INTO status_laporan
            (
                laporan_id,
                old_status,
                new_status,
                changed_by,
                changer_role,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                oldStatus,
                status,
                req.user.id,
                req.user.role,
                alasan_penolakan || null
            ]
        );

        await db.query(
            `
            INSERT INTO notifications
            (
                user_id,
                laporan_id,
                title,
                message
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                laporan[0].user_id,
                id,
                "Status Laporan Diperbarui",
                `Laporan "${laporan[0].title}" sekarang berstatus ${status}`
            ]
        );

        res.status(200).json({
            message: "Status laporan berhasil diperbarui"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const reviewLaporan = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            kategori_id,
            priority,
            notes
        } = req.body;

        const [laporan] = await db.query(
            `
            SELECT *
            FROM laporan
            WHERE id = ?
            `,
            [id]
        );

        if (laporan.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        if (laporan[0].status === "draft") {
            return res.status(400).json({
                message: "Draft belum bisa direview"
            });
        }

        if (laporan[0].status !== "pending") {
            return res.status(400).json({
                message: "Laporan sudah direview"
            });
        }

        const [kategori] = await db.query(
            `
            SELECT *
            FROM kategori
            WHERE id = ?
            `,
            [kategori_id]
        );

        if (kategori.length === 0) {
            return res.status(404).json({
                message: "Kategori tidak ditemukan"
            });
        }

        await db.query(
            `
            UPDATE laporan
            SET
                kategori_id = ?,
                priority = ?,
                status = 'diperiksa',
                visibility = 'private',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                kategori_id,
                priority,
                id
            ]
        );

        await db.query(
            `
            INSERT INTO status_laporan
            (
                laporan_id,
                old_status,
                new_status,
                changed_by,
                changer_role,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                "pending",
                "diperiksa",
                req.user.id,
                req.user.role,
                notes || null
            ]
        );

        await db.query(
            `
            INSERT INTO aktifitas_admin
            (
                admin_id,
                tipe_aktifitas,
                description,
                target_laporan_id
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.user.id,
                "Review Laporan",
                `Admin mereview laporan ID ${id}`,
                id
            ]
        );

        res.status(200).json({
            message: "Laporan berhasil direview"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const verifyLaporan = async (req, res) => {

    try {

        const { id } = req.params;

        const [laporan] = await db.query(
            `
            SELECT *
            FROM laporan
            WHERE id = ?
            `,
            [id]
        );

        if (laporan.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        if (laporan[0].status !== "diperiksa") {
            return res.status(400).json({
                message: "Laporan harus diperiksa terlebih dahulu"
            });
        }

        await db.query(
            `
            UPDATE laporan
            SET
                status = 'diverifikasi',
                visibility = 'private',
                verified_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [id]
        );

        await db.query(
            `
            INSERT INTO status_laporan
            (
                laporan_id,
                old_status,
                new_status,
                changed_by,
                changer_role
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                id,
                "diperiksa",
                "diverifikasi",
                req.user.id,
                req.user.role
            ]
        );

        await db.query(
            `
            INSERT INTO aktifitas_admin
            (
                admin_id,
                tipe_aktifitas,
                description,
                target_laporan_id
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.user.id,
                "Verifikasi Laporan",
                `Admin memverifikasi laporan ID ${id}`,
                id
            ]
        );

        res.status(200).json({
            message: "Laporan berhasil diverifikasi"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const rejectLaporan = async (req, res) => {

    try {

        const { id } = req.params;

        const { alasan_penolakan } = req.body;

        const [laporan] = await db.query(
            `
            SELECT *
            FROM laporan
            WHERE id = ?
            `,
            [id]
        );

        if (laporan.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        if (
            laporan[0].status !== "pending" &&
            laporan[0].status !== "diperiksa"
        ) {
            return res.status(400).json({
                message: "Laporan tidak bisa ditolak"
            });
        }

        if (!alasan_penolakan) {
            return res.status(400).json({
                message: "Alasan penolakan wajib diisi"
            });
        }

        await db.query(
            `
            UPDATE laporan
            SET
                status = 'ditolak',
                visibility = 'private',
                alasan_penolakan = ?,
                rejected_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                alasan_penolakan,
                id
            ]
        );

        await db.query(
            `
            INSERT INTO status_laporan
            (
                laporan_id,
                old_status,
                new_status,
                changed_by,
                changer_role,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                laporan[0].status,
                "ditolak",
                req.user.id,
                req.user.role,
                alasan_penolakan
            ]
        );

        await db.query(
            `
            INSERT INTO aktifitas_admin
            (
                admin_id,
                tipe_aktifitas,
                description,
                target_laporan_id
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.user.id,
                "Tolak Laporan",
                `Admin menolak laporan ID ${id}`,
                id
            ]
        );

        res.status(200).json({
            message: "Laporan berhasil ditolak"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};