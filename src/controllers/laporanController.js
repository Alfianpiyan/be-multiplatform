import db from "../config/db.js";

export const createLaporan = async (req, res) => {

    try {

        const {
            kategori_id,
            title,
            description,
            lokasi_kejadian,
            waktu_kejadian,
            is_public
        } = req.body;

        const [laporan] = await db.query(
            `
            INSERT INTO laporan
            (
                user_id,
                kategori_id,
                title,
                description,
                lokasi_kejadian,
                waktu_kejadian,
                is_public
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                kategori_id || null,
                title || null,
                description || null,
                lokasi_kejadian || null,
                waktu_kejadian || null,
                is_public || false
            ]
        );

        res.status(201).json({
            message: "Draft laporan berhasil dibuat",
            data: {
                laporan_id: laporan.insertId,
                status: "draft"
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getMyDraftLaporan = async (req, res) => {

    try {

        const [draft] = await db.query(
            `
            SELECT
                laporan.id,
                laporan.title,
                laporan.description,
                laporan.status,
                laporan.priority,
                laporan.lokasi_kejadian,
                laporan.waktu_kejadian,
                laporan.is_public,
                laporan.created_at,

                kategori.kategori

            FROM laporan

            LEFT JOIN kategori
                ON laporan.kategori_id = kategori.id

            WHERE laporan.user_id = ?
            AND laporan.status = 'draft'

            ORDER BY laporan.created_at DESC
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Draft laporan berhasil diambil",
            data: draft
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const updateDraftLaporan = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            kategori_id,
            title,
            description,
            lokasi_kejadian,
            waktu_kejadian
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

        if (laporan[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        if (
            laporan[0].status !== "draft" &&
            laporan[0].status !== "pending"
        ) {
            return res.status(400).json({
                message: "Laporan tidak bisa diedit"
            });
        }

        await db.query(
            `
            UPDATE laporan
            SET
                kategori_id = ?,
                title = ?,
                description = ?,
                lokasi_kejadian = ?,
                waktu_kejadian = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                kategori_id || null,
                title || null,
                description || null,
                lokasi_kejadian || null,
                waktu_kejadian || null,
                id
            ]
        );

        res.status(200).json({
            message: "Laporan berhasil diperbarui"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};


export const submitLaporan = async (req, res) => {

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

        if (laporan[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        if (laporan[0].status !== "draft") {
            return res.status(400).json({
                message: "Laporan sudah dikirim"
            });
        }

        if (
            !laporan[0].kategori_id ||
            !laporan[0].title ||
            !laporan[0].description
        ) {
            return res.status(400).json({
                message: "Data laporan belum lengkap"
            });
        }

        await db.query(
            `
            UPDATE laporan
            SET
                status = 'pending',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [id]
        );

        res.status(200).json({
            message: "Laporan berhasil dikirim"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getMyLaporan = async (req, res) => {

    try {

        const [laporan] = await db.query(
            `
            SELECT
                laporan.id,
                laporan.title,
                laporan.description,
                laporan.status,
                laporan.priority,
                laporan.created_at,

                kategori.kategori

            FROM laporan

            LEFT JOIN kategori
                ON laporan.kategori_id = kategori.id

            WHERE laporan.user_id = ?
            AND laporan.status != 'draft'

            ORDER BY laporan.created_at DESC
            `,
            [req.user.id]
        );

        res.status(200).json({
            message: "Laporan user berhasil diambil",
            data: laporan
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getPublicLaporan = async (req, res) => {

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

            WHERE laporan.visibility = 'public'
            AND laporan.status = 'selesai'

            ORDER BY laporan.created_at DESC
            `
        );

        res.status(200).json({
            message: "Laporan publik berhasil diambil",
            data: laporan
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const uploadLaporanImages = async (req, res) => {

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

        if (laporan[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "File gambar wajib diupload"
            });
        }

        for (const file of req.files) {

            await db.query(
                `
                INSERT INTO laporan_images
                (
                    laporan_id,
                    image_url
                )
                VALUES (?, ?)
                `,
                [
                    id,
                    file.path
                ]
            );

        }

        res.status(201).json({
            message: "Gambar laporan berhasil diupload"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getDetailLaporan = async (req, res) => {

    try {

        const { id } = req.params;

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
                laporan.updated_at,

                users.userName,

                kategori.kategori

            FROM laporan

            JOIN users
                ON laporan.user_id = users.id

            LEFT JOIN kategori
                ON laporan.kategori_id = kategori.id

            WHERE laporan.id = ?
            `,
            [id]
        );

        if (laporan.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        if (
            laporan[0].visibility !== "public"
        ) {
            return res.status(403).json({
                message: "Laporan tidak dapat diakses"
            });
        }

        const [images] = await db.query(
            `
            SELECT
                id,
                image_url
            FROM laporan_images
            WHERE laporan_id = ?
            `,
            [id]
        );

        res.status(200).json({
            message: "Detail laporan berhasil diambil",
            data: {
                ...laporan[0],
                images
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getLaporanTimeline = async (req, res) => {

    try {

        const { id } = req.params;

        const [timeline] = await db.query(
            `
            SELECT
                status_laporan.id,
                status_laporan.old_status,
                status_laporan.new_status,
                status_laporan.notes,
                status_laporan.created_at,

                users.userName,

                status_laporan.changer_role

            FROM status_laporan

            JOIN users
                ON status_laporan.changed_by = users.id

            WHERE status_laporan.laporan_id = ?

            ORDER BY status_laporan.created_at ASC
            `,
            [id]
        );

        res.status(200).json({
            message: "Timeline laporan berhasil diambil",
            data: timeline
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const deleteDraftLaporan = async (req, res) => {

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
                message: "Draft laporan tidak ditemukan"
            });
        }

        if (laporan[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        if (laporan[0].status !== "draft") {
            return res.status(400).json({
                message: "Hanya draft yang bisa dihapus"
            });
        }

        await db.query(
            `
            DELETE FROM laporan
            WHERE id = ?
            `,
            [id]
        );

        res.status(200).json({
            message: "Draft laporan berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};