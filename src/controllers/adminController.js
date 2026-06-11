import db from "../config/db.js";
import bcrypt from "bcrypt";

export const createAdmin = async (req, res) => {

    try {

        const {
            userName,
            email,
            password,
            role,
            city
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

        if (!city) {
            return res.status(400).json({
                message: "City wajib diisi"
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
                role,
                city
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                userName,
                email,
                hashedPassword,
                role,
                city
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
        // 1. Query dasar
        let sql = `
            SELECT
                laporan.id,
                laporan.title,
                laporan.report_description,
                laporan.city,
                laporan.status,
                laporan.visibility,
                laporan.created_at,
                users.userName,
                kategori.kategori
            FROM laporan
            JOIN users ON laporan.user_id = users.id
            LEFT JOIN kategori ON laporan.kategori_id = kategori.id
            WHERE laporan.status != 'draft'
        `;
        
        const params = [];

        // 2. Logic Fleksibel: 
        // Jika rolenya BUKAN superadmin, baru kita tambahkan filter berdasarkan kota
        if (req.user.role !== 'superadmin') {
            sql += ` AND laporan.city = ?`;
            params.push(req.user.city);
        }

        sql += ` ORDER BY laporan.created_at DESC`;

        // 3. Eksekusi query
        const [laporan] = await db.query(sql, params);

        res.status(200).json({
            message: "Laporan berhasil diambil",
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
            visibility,
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

        if (
            visibility &&
            !["public", "private"].includes(visibility)
        ) {
            return res.status(400).json({
                message: "Visibility tidak valid"
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

        if (laporan[0].city !== req.user.city) {
            return res.status(403).json({
                message: "Anda tidak bisa mengubah status laporan dari kota lain"
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

        let finalVisibility = laporan[0].visibility;

        if (status === "selesai") {

            if (!visibility) {
                return res.status(400).json({
                    message:
                        "Visibility wajib dipilih saat laporan selesai"
                });
            }

            finalVisibility = visibility;
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
                finalVisibility,
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

        if (laporan[0].city !== req.user.city) {
            return res.status(403).json({
                message: "Anda tidak bisa mereview laporan dari kota lain"
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
                status = 'diperiksa',
                visibility = 'private',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                kategori_id,
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
                "Laporan Sedang Ditinjau",
                `Laporan "${laporan[0].title}" sedang diperiksa oleh admin`
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

        if (laporan[0].city !== req.user.city) {
            return res.status(403).json({
                message: "Anda tidak bisa memverifikasi laporan dari kota lain"
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
                "Laporan Diverifikasi",
                `Laporan "${laporan[0].title}" berhasil diverifikasi`
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

        if (laporan[0].city !== req.user.city) {
            return res.status(403).json({
                message: "Anda tidak bisa menolak laporan dari kota lain"
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
                "Laporan Ditolak",
                `Laporan ditolak dengan alasan: ${alasan_penolakan}`
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

export const createKategori = async (req, res) => {

    try {

        const { kategori } = req.body;

        if (!kategori) {
            return res.status(400).json({
                message: "Kategori wajib diisi"
            });
        }

        const [existingKategori] = await db.query(
            `
            SELECT *
            FROM kategori
            WHERE kategori = ?
            `,
            [kategori]
        );

        if (existingKategori.length > 0) {
            return res.status(400).json({
                message: "Kategori sudah ada"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO kategori
            (
                kategori
            )
            VALUES (?)
            `,
            [kategori]
        );

        res.status(201).json({
            message: "Kategori berhasil dibuat",
            data: {
                id: result.insertId,
                kategori
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getAllKategori = async (req, res) => {

    try {

        const [kategori] = await db.query(
            `
            SELECT *
            FROM kategori
            ORDER BY kategori ASC
            `
        );

        res.status(200).json({
            message: "Kategori berhasil diambil",
            data: kategori
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const updateKategori = async (req, res) => {

    try {

        const { id } = req.params;
        const { kategori } = req.body;

        const [existingKategori] = await db.query(
            `
            SELECT *
            FROM kategori
            WHERE id = ?
            `,
            [id]
        );

        if (existingKategori.length === 0) {
            return res.status(404).json({
                message: "Kategori tidak ditemukan"
            });
        }

        await db.query(
            `
            UPDATE kategori
            SET kategori = ?
            WHERE id = ?
            `,
            [
                kategori,
                id
            ]
        );

        res.status(200).json({
            message: "Kategori berhasil diperbarui"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const deleteKategori = async (req, res) => {

    try {

        const { id } = req.params;

        const [kategori] = await db.query(
            `
            SELECT *
            FROM kategori
            WHERE id = ?
            `,
            [id]
        );

        if (kategori.length === 0) {
            return res.status(404).json({
                message: "Kategori tidak ditemukan"
            });
        }
        const [laporan] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM laporan
            WHERE kategori_id = ?
            `,
            [id]
        );

        if (laporan[0].total > 0) {
            return res.status(400).json({
                message: `Kategori masih digunakan oleh ${laporan[0].total} laporan`
            });
        }

        await db.query(
            `
            DELETE FROM kategori
            WHERE id = ?
            `,
            [id]
        );

        res.status(200).json({
            message: "Kategori berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const searchLaporan = async (req, res) => {

    try {

        const { keyword } = req.query;

        if (!keyword) {
            return res.status(400).json({
                message: "Keyword wajib diisi"
            });
        }

        let query = `
            SELECT
                laporan.id,
                laporan.title,
                laporan.report_description,
                laporan.city,
                laporan.status,
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
        `;

        const params = [];

        if (req.user.role !== "superadmin") {

            query += `
                AND laporan.city = ?
            `;

            params.push(req.user.city);

        }

        query += `
            AND (
                laporan.title LIKE ?
                OR laporan.report_description LIKE ?
                OR users.userName LIKE ?
                OR laporan.city LIKE ?
                OR kategori.kategori LIKE ?
            )

            ORDER BY laporan.created_at DESC
        `;

        const searchKeyword = `%${keyword}%`;

        params.push(
            searchKeyword,
            searchKeyword,
            searchKeyword,
            searchKeyword,
            searchKeyword
        );

        const [laporan] = await db.query(
            query,
            params
        );

        res.status(200).json({
            message: "Hasil pencarian laporan",
            data: laporan
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};