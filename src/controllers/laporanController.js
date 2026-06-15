import db from "../config/db.js";

    export const createLaporan = async (req, res) => {
        try {

            const {
                kategori_id,
                title,
                report_description,
                city,
                location_description,
                latitude,
                longitude,
                waktu_kejadian,
                visibility
            } = req.body;

            if (kategori_id) {

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

            }

            if (
                visibility &&
                visibility !== "private" &&
                visibility !== "public"
            ) {
                return res.status(400).json({
                    message: "Visibility tidak valid"
                });
            }

            const [laporan] = await db.query(
                `
                INSERT INTO laporan
                (
                    user_id,
                    kategori_id,
                    title,
                    report_description,
                    city,
                    location_description,
                    latitude,
                    longitude,
                    waktu_kejadian,
                    visibility
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    req.user.id,
                    kategori_id || null,
                    title || null,
                    report_description || null,
                    city || null,
                    location_description || null,
                    latitude || null,
                    longitude || null,
                    waktu_kejadian || null,
                    visibility || "private"
                ]
            );

            if (req.files && req.files.length > 0) {

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
                            laporan.insertId,
                            file.path
                        ]
                    );

                }

            }

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
                laporan.report_description,
                laporan.city,
                laporan.location_description,
                laporan.latitude,
                laporan.longitude,
                laporan.waktu_kejadian,
                laporan.status,
                laporan.visibility,
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
            title,
            report_description,
            city,
            location_description,
            latitude,
            longitude,
            waktu_kejadian,
            visibility
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
                title = ?,
                report_description = ?,
                city = ?,
                location_description = ?,
                latitude = ?,
                longitude = ?,
                waktu_kejadian = ?,
                visibility = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                title || null,
                report_description || null,
                city || null,
                location_description || null,
                latitude || null,
                longitude || null,
                waktu_kejadian || null,
                visibility || "private",
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
        const { 
            title, 
            report_description, 
            city, 
            location_description, 
            kategori_id, 
            latitude, 
            longitude, 
            waktu_kejadian, 
            visibility 
        } = req.body;

        // 1. Cek apakah draft laporan benar-benar ada di database
        const [laporanCheck] = await db.query(`SELECT * FROM laporan WHERE id = ?`, [id]);
        if (laporanCheck.length === 0) {
            return res.status(404).json({ message: "Laporan tidak ditemukan" });
        }

        // 2. Pastikan yang mengakses adalah warga pemilik laporan tersebut
        if (laporanCheck[0].user_id !== req.user.id) {
            return res.status(403).json({ message: "Akses ditolak" });
        }

        // 3. Gabungkan data baru dari frontend dengan data lama di DB (jika ada yang tidak terisi)
        const finalTitle = title || laporanCheck[0].title;
        const finalDesc = report_description || laporanCheck[0].report_description;
        const finalCity = city || laporanCheck[0].city;
        const finalLoc = location_description || laporanCheck[0].location_description;

        // 4. Validasi akhir sebelum status laporan berubah menjadi 'pending'
        if (!finalTitle || !finalDesc || !finalCity || !finalLoc) {
            return res.status(400).json({ 
                message: "Gagal mengirim! Kolom judul, deskripsi, kota, dan lokasi detail wajib diisi." 
            });
        }

        // 5. Update data laporan dan naikkan statusnya dari 'draft' menjadi 'pending'
        await db.query(
            `UPDATE laporan SET 
                title = ?, 
                report_description = ?, 
                city = ?, 
                location_description = ?, 
                kategori_id = ?, 
                latitude = ?, 
                longitude = ?, 
                waktu_kejadian = ?, 
                visibility = ?, 
                status = 'pending', 
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [
                finalTitle, 
                finalDesc, 
                finalCity, 
                finalLoc,
                kategori_id || laporanCheck[0].kategori_id,
                latitude || laporanCheck[0].latitude,
                longitude || laporanCheck[0].longitude,
                waktu_kejadian || laporanCheck[0].waktu_kejadian,
                visibility || laporanCheck[0].visibility || 'private',
                id
            ]
        );

        // 6. Catat log perubahan status ke tabel riwayat (status_laporan)
        await db.query(
            `INSERT INTO status_laporan (laporan_id, old_status, new_status, changed_by, changer_role, notes) 
             VALUES (?, 'draft', 'pending', ?, 'user', 'Laporan berhasil dikirim oleh warga')`,
            [id, req.user.id]
        );

        // 7. SINKRONISASI NOTIFIKASI: Ambil ID Admin kota tujuan & semua Superadmin
        const [targetAdmins] = await db.query(
            `SELECT id FROM users WHERE (role = 'admin' AND LOWER(TRIM(city)) = LOWER(TRIM(?))) OR role = 'superadmin'`,
            [finalCity]
        );

        // 8. Masukkan baris notifikasi ke database secara looping
        for (const admin of targetAdmins) {
            await db.query(
                `INSERT INTO notifications (user_id, laporan_id, title, message) VALUES (?, ?, ?, ?)`,
                [
                    admin.id, 
                    id, 
                    "Aduan Masuk Baru", 
                    `Ada laporan baru untuk kota ${finalCity} dengan judul: "${finalTitle}"`
                ]
            );
        }

        return res.status(200).json({ 
            message: "Laporan aduan berhasil dikirim ke petugas wilayah!" 
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMyLaporan = async (req, res) => {

    try {
        const [laporan] = await db.query(
            `
            SELECT
                laporan.id,
                laporan.title,
                laporan.report_description,
                laporan.city,
                laporan.location_description,
                laporan.status,
                laporan.visibility,
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
        // Ambil data user dari authMiddleware (jika ada token JWT yang lolos)
        const userRole = req.user?.role;

        let querySQL = "";
        let queryParams = [];

        // 👑 KONDISI 1: JIKA YANG MENGAKSES ADALAH ADMIN / SUPERADMIN
        if (userRole === "admin" || userRole === "superadmin") {
            querySQL = `
                SELECT
                    laporan.id,
                    laporan.title,
                    laporan.report_description,
                    laporan.city,
                    laporan.location_description,
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
                ORDER BY laporan.created_at DESC
            `;
        } 
        // 👤 KONDISI 2: JIKA USER BIASA ATAU PUBLIK TANPA LOGIN
        else {
            querySQL = `
                SELECT
                    laporan.id,
                    laporan.title,
                    laporan.report_description,
                    laporan.city,
                    laporan.location_description,
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
                WHERE laporan.visibility = 'public'
                AND laporan.status = 'selesai'
                ORDER BY laporan.created_at DESC
            `;
        }

        const [laporan] = await db.query(querySQL, queryParams);

        res.status(200).json({
            message: userRole ? "Seluruh data laporan internal berhasil diambil" : "Laporan publik berhasil diambil",
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

        // 1. Ambil data laporan
        const [rows] = await db.query(
            `SELECT * FROM laporan WHERE id = ?`,
            [id]
        );

        // Pastikan rows ada dan memiliki data
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        const laporan = rows[0];

        // 2. Validasi kepemilikan laporan
        if (laporan.user_id !== req.user.id) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        // 3. Validasi status laporan
        if (laporan.status !== "draft" && laporan.status !== "pending") {
            return res.status(400).json({
                message: "Laporan tidak bisa ditambah gambar"
            });
        }

        // 4. Validasi file kiriman dari Multer
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "File gambar wajib diupload"
            });
        }

        if (req.files.length > 5) {
            return res.status(400).json({
                message: "Maksimal memuat 5 gambar"
            });
        }

        // 🔥 SOLUSI UTAMA: Jika statusnya masih draf, hapus record gambar lama di DB 
        // supaya tidak terjadi penumpukan (akumulasi) saat user klik kirim ulang.
        if (laporan.status === "draft") {
            await db.query(
                `DELETE FROM laporan_images WHERE laporan_id = ?`,
                [id]
            );
        } else {
            // Jika statusnya 'pending' (bukan draf), gunakan hitungan akumulasi biasa
            const [imageCountRows] = await db.query(
                `SELECT COUNT(*) AS total FROM laporan_images WHERE laporan_id = ?`,
                [id]
            );
            const totalGambarSaatIni = imageCountRows[0].total;

            if (totalGambarSaatIni + req.files.length > 5) {
                return res.status(400).json({
                    message: `Maksimal 5 gambar. Saat ini sudah ada ${totalGambarSaatIni} gambar terlampir.`
                });
            }
        }

        // 5. Masukkan data gambar baru ke database
        for (const file of req.files) {
            // Ambil path file (gunakan file.filename atau file.path tergantung konfigurasi disk/cloudinary kamu)
            const imagePath = file.path || file.filename; 

            await db.query(
                `
                INSERT INTO laporan_images 
                (laporan_id, image_url) 
                VALUES (?, ?)
                `,
                [id, imagePath]
            );
        }

        return res.status(201).json({
            message: "Gambar laporan berhasil diupload"
        });

    } catch (error) {
        console.error("Error pada uploadLaporanImages:", error);
        return res.status(500).json({
            message: error.message || "Terjadi kesalahan pada server"
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
                laporan.report_description,
                laporan.city,
                laporan.location_description,
                laporan.latitude,
                laporan.longitude,
                laporan.waktu_kejadian,
                laporan.status,
                laporan.visibility,
                laporan.user_id, -- Diperlukan untuk validasi hak milik user
                laporan.created_at,
                laporan.updated_at,
                users.userName,
                kategori.kategori
            FROM laporan
            JOIN users ON laporan.user_id = users.id
            LEFT JOIN kategori ON laporan.kategori_id = kategori.id
            WHERE laporan.id = ?
            `,
            [id]
        );

        if (laporan.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        const dataLaporan = laporan[0]; 

        // 1. Validasi Hak Akses Khusus Admin Wilayah
        if (req.user.role === "admin") {
            const laporanCity = dataLaporan.city ? dataLaporan.city.toLowerCase().trim() : "";
            const adminCity = req.user.city ? req.user.city.toLowerCase().trim() : "";

            if (laporanCity !== adminCity) {
                return res.status(403).json({
                    message: "Akses ditolak: Wilayah laporan tidak sesuai dengan area tugas Anda."
                });
            }
        } 
        // 2. Validasi Hak Akses jika Pengguna Biasa (Bukan Admin)
        else {
            // Jika laporan private DAN bukan milik user yang sedang login, maka blokir
            if (dataLaporan.visibility !== "public" && dataLaporan.user_id !== req.user.id) {
                return res.status(403).json({
                    message: "Laporan tidak dapat diakses atau bersifat privat."
                });
            }
        }

        // 3. Ambil Lampiran Gambar Utama (Hanya dieksekusi jika lolos pengecekan di atas)
        const [images] = await db.query(
            `
            SELECT id, image_url
            FROM laporan_images
            WHERE laporan_id = ?
            `,
            [id]
        );

        // 4. Ambil Lampiran Gambar Perkembangan Lapangan
        const [progressImages] = await db.query(
            `
            SELECT id, image_url, description, created_at
            FROM laporan_progress_images
            WHERE laporan_id = ?
            ORDER BY created_at ASC
            `,
            [id]
        );

        // 5. Kirim Respons Utuh ke Frontend (Satu pintu pengiriman data)
        return res.status(200).json({
            message: "Detail laporan berhasil diambil",
            data: {
                ...dataLaporan,
                before_images: images,
                progress_images: progressImages
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
export const getLaporanTimeline = async (req, res) => {

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
        

        if (
            req.user.role === "user" &&
            laporan[0].user_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        if (
            req.user.role === "admin" &&
            laporan[0].city !== req.user.city
        ) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

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

export const getDetailLaporanPrivate = async (req, res) => {

    try {

        const { id } = req.params;

        const [laporan] = await db.query(
            `
            SELECT
                laporan.*,

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

        const dataLaporan = laporan[0];

        // Proteksi wilayah kerja admin
        const laporanCity = dataLaporan.city ? dataLaporan.city.toLowerCase().trim() : "";
        const adminCity = req.user.city ? req.user.city.toLowerCase().trim() : "";

        if (laporanCity !== adminCity) {
            return res.status(403).json({
                message: "Akses ditolak: Wilayah aduan di luar area tugas Anda."
            });
        }

        // Kirim data lengkap ke admin
        return res.status(200).json({
            message: "Detail laporan internal berhasil diambil",
            data: { ...dataLaporan, before_images: images, progress_images: progressImages }
        });
        

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

        const [timeline] = await db.query(
            `
            SELECT
                status_laporan.*,
                users.userName

            FROM status_laporan

            JOIN users
                ON status_laporan.changed_by = users.id

            WHERE laporan_id = ?

            ORDER BY status_laporan.created_at ASC
            `,
            [id]
        );

        const [internalComments] = await db.query(
            `
            SELECT
                komentar_internal.id,
                komentar_internal.komentar,
                komentar_internal.created_at,
                komentar_internal.updated_at,

                users.id AS user_id,
                users.userName,
                users.role

            FROM komentar_internal

            JOIN users
                ON komentar_internal.user_id = users.id

            WHERE komentar_internal.laporan_id = ?

            ORDER BY komentar_internal.created_at ASC
            `,
            [id]
        );

        const [progressImages] = await db.query(
            `
            SELECT
                laporan_progress_images.id,
                laporan_progress_images.image_url,
                laporan_progress_images.description,
                laporan_progress_images.created_at,

                users.id AS uploaded_by,
                users.userName

            FROM laporan_progress_images

            JOIN users
                ON laporan_progress_images.uploaded_by = users.id

            WHERE laporan_progress_images.laporan_id = ?

            ORDER BY laporan_progress_images.created_at ASC
            `,
            [id]
        );

        res.status(200).json({
            message: "Detail laporan berhasil diambil",
            data: {
                ...dataLaporan,
                images,
                timeline,
                internal_comments: internalComments,
                progress_images: progressImages
            }
        });
    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getMyDetailLaporan = async (req, res) => {

    try {

        const { id } = req.params;

        const [laporan] = await db.query(
            `
            SELECT
                laporan.id,
                laporan.title,
                laporan.report_description,
                laporan.city,
                laporan.location_description,
                laporan.latitude,
                laporan.longitude,
                laporan.waktu_kejadian,
                laporan.status,
                laporan.visibility,
                laporan.alasan_penolakan,
                laporan.created_at,
                laporan.updated_at,

                kategori.kategori

            FROM laporan

            LEFT JOIN kategori
                ON laporan.kategori_id = kategori.id

            WHERE laporan.id = ?
            AND laporan.user_id = ?
            `,
            [
                id,
                req.user.id
            ]
        );

        if (laporan.length === 0) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
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

export const createInternalComment = async (req, res) => {

    try {

        const { id } = req.params;

        const { komentar } = req.body;

        if (!komentar) {
            return res.status(400).json({
                message: "Komentar wajib diisi"
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

        const dataLaporan = laporan[0];

        if (
            req.user.role === "user" &&
            dataLaporan.user_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        if (req.user.role === "admin") {
            const laporanCity = dataLaporan.city ? dataLaporan.city.toLowerCase().trim() : "";
            const adminCity = req.user.city ? req.user.city.toLowerCase().trim() : "";

            if (laporanCity !== adminCity) {
                return res.status(403).json({
                    message: "Akses ditolak: Wilayah laporan tidak sesuai dengan area tugas Anda."
                });
            }
        }

        const allowedStatus = [
            "pending",         // 👈 Tambahkan ini agar saat laporan baru masuk sudah bisa dichat
            "diperiksa",
            "diverifikasi",
            "tindak_lanjut"
        ];

        await db.query(
            `
            INSERT INTO komentar_internal
            (
                laporan_id,
                user_id,
                komentar
            )
            VALUES (?, ?, ?)
            `,
            [
                id,
                req.user.id,
                komentar
            ]
        );

        const [sender] = await db.query(
            `
            SELECT userName
            FROM users
            WHERE id = ?
            `,
            [req.user.id]
        );

        const senderName = sender[0].userName;

        if (req.user.role === "user") {

            const [admins] = await db.query(
                `
                SELECT id
                FROM users
                WHERE role = 'admin'
                AND city = ?
                `,
                [dataLaporan.city]
            );

            for (const admin of admins) {

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
                        admin.id,
                        id,
                        "Komentar Baru",
                        `${senderName} mengirim komentar pada laporan #${id}`
                    ]
                );

            }

        } else {

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
                    dataLaporan.user_id,
                    id,
                    "Balasan Admin",
                    `${senderName} membalas diskusi laporan Anda`
                ]
            );

        }

        res.status(201).json({
            message: "Komentar berhasil ditambahkan"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const uploadProgressImages = async (req, res) => {

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

        if (
            req.user.role !== "admin" &&
            req.user.role !== "superadmin"
        ) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        if (
            laporan[0].status !== "tindak_lanjut"
        ) {
            return res.status(400).json({
                message: "Laporan belum masuk tahap tindak lanjut"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "Foto wajib diupload"
            });
        }

        const { description } = req.body;

        for (const file of req.files) {

            await db.query(
                `
                INSERT INTO laporan_progress_images
                (
                    laporan_id,
                    image_url,
                    description,
                    uploaded_by
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    id,
                    file.path,
                    description || null,
                    req.user.id
                ]
            );

        }

        res.status(201).json({
            message: "Progress berhasil ditambahkan"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getProgressImages = async (req, res) => {

    try {

        const { id } = req.params;

        const [progress] = await db.query(
            `
            SELECT
                laporan_progress_images.*,

                users.userName

            FROM laporan_progress_images

            JOIN users
                ON laporan_progress_images.uploaded_by = users.id

            WHERE laporan_id = ?

            ORDER BY created_at ASC
            `,
            [id]
        );

        res.status(200).json({
            message: "Progress berhasil diambil",
            data: progress
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const updateProgressDescription = async (req, res) => {

    try {

        const { progressId } = req.params;

        const { description } = req.body;

        const [progress] = await db.query(
            `
            SELECT *
            FROM laporan_progress_images
            WHERE id = ?
            `,
            [progressId]
        );

        if (progress.length === 0) {
            return res.status(404).json({
                message: "Progress tidak ditemukan"
            });
        }

        await db.query(
            `
            UPDATE laporan_progress_images
            SET description = ?
            WHERE id = ?
            `,
            [
                description,
                progressId
            ]
        );

        res.status(200).json({
            message: "Deskripsi progress berhasil diperbarui"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};
export const deleteProgressImage = async (req, res) => {

    try {

        const { imageId } = req.params;

        const [progress] = await db.query(
            `
            SELECT *
            FROM laporan_progress_images
            WHERE id = ?
            `,
            [imageId]
        );

        if (progress.length === 0) {
            return res.status(404).json({
                message: "Foto tidak ditemukan"
            });
        }

        await db.query(
            `
            DELETE FROM laporan_progress_images
            WHERE id = ?
            `,
            [imageId]
        );

        res.status(200).json({
            message: "Foto progress berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getInternalComments = async (req, res) => {

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

        const dataLaporan = laporan[0];

        if (
            req.user.role === "user" &&
            dataLaporan.user_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }
        if (req.user.role === "admin") {
            // Gunakan toLowerCase() agar "Bandung" dan "bandung" dianggap sama
            const laporanCity = dataLaporan.city ? dataLaporan.city.toLowerCase().trim() : "";
            const adminCity = req.user.city ? req.user.city.toLowerCase().trim() : "";

            if (laporanCity !== adminCity) {
                return res.status(403).json({
                    message: "Akses ditolak: Wilayah laporan tidak sesuai dengan area tugas Anda."
                });
            }
        }

        const [comments] = await db.query(
            `
            SELECT
                komentar_internal.id,
                komentar_internal.komentar,
                komentar_internal.created_at,
                komentar_internal.updated_at,

                users.id AS user_id,
                users.userName,
                users.role

            FROM komentar_internal

            JOIN users
                ON komentar_internal.user_id = users.id

            WHERE komentar_internal.laporan_id = ?

            ORDER BY komentar_internal.created_at ASC
            `,
            [id]
        );

        res.status(200).json({
            message: "Komentar berhasil diambil",
            data: comments
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const deleteInternalComment = async (req, res) => {

    try {

        const { commentId } = req.params;

        const [comment] = await db.query(
            `
            SELECT *
            FROM komentar_internal
            WHERE id = ?
            `,
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({
                message: "Komentar tidak ditemukan"
            });
        }

        const dataComment = comment[0];

        if (
            req.user.role !== "superadmin" &&
            dataComment.user_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        await db.query(
            `
            DELETE FROM komentar_internal
            WHERE id = ?
            `,
            [commentId]
        );

        res.status(200).json({
            message: "Komentar berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const createPublicComment = async (req, res) => {

    try {

        const { id } = req.params;

        const { komentar } = req.body;

        if (!komentar) {
            return res.status(400).json({
                message: "Komentar wajib diisi"
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

        if (
            laporan[0].visibility !== "public" ||
            laporan[0].status !== "selesai"
        ) {
            return res.status(400).json({
                message: "Komentar hanya tersedia untuk laporan publik yang telah selesai"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO komentar_laporan
            (
                laporan_id,
                user_id,
                komentar
            )
            VALUES (?, ?, ?)
            `,
            [
                id,
                req.user.id,
                komentar
            ]
        );

        if (laporan[0].user_id !== req.user.id) {

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
                    "Komentar Baru",
                    "Seseorang mengomentari laporan Anda"
                ]
            );

        }

        res.status(201).json({
            message: "Komentar berhasil ditambahkan",
            data: {
                id: result.insertId
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const getPublicComments = async (req, res) => {

    try {

        const { id } = req.params;

        const [comments] = await db.query(
            `
            SELECT
                komentar_laporan.id,
                komentar_laporan.komentar,
                komentar_laporan.created_at,

                users.id AS user_id,
                users.userName

            FROM komentar_laporan

            JOIN users
                ON komentar_laporan.user_id = users.id

            WHERE laporan_id = ?
            AND is_deleted = FALSE

            ORDER BY komentar_laporan.created_at ASC
            `,
            [id]
        );

        res.status(200).json({
            message: "Komentar berhasil diambil",
            data: comments
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

export const deletePublicComment = async (req, res) => {

    try {

        const { commentId } = req.params;

        const [comment] = await db.query(
            `
            SELECT *
            FROM komentar_laporan
            WHERE id = ?
            `,
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({
                message: "Komentar tidak ditemukan"
            });
        }

        if (
            comment[0].user_id !== req.user.id &&
            req.user.role !== "admin" &&
            req.user.role !== "superadmin"
        ) {
            return res.status(403).json({
                message: "Akses ditolak"
            });
        }

        await db.query(
            `
            UPDATE komentar_laporan
            SET is_deleted = TRUE
            WHERE id = ?
            `,
            [commentId]
        );

        res.status(200).json({
            message: "Komentar berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};