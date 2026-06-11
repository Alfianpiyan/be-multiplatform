import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Cek format header "Bearer <token>"
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Akses ditolak: Token tidak ditemukan atau format salah"
            });
        }

        const token = authHeader.split(" ")[1];

        // Verifikasi token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Simpan data user ke request biar bisa dipake di controller
        req.user = decoded;

        next();
    } catch (error) {
        // Token kadaluwarsa atau palsu
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Sesi anda telah berakhir atau token tidak valid"
        });
    }
};