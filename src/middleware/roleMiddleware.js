export const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        // Pastikan req.user sudah ada (dari authMiddleware)
        if (!req.user) {
            return res.status(401).json({ error: "UNAUTHORIZED", message: "Harus login terlebih dahulu" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "FORBIDDEN",
                message: "Akses ditolak: Anda tidak memiliki izin untuk fitur ini"
            });
        }

        next();
    };
};