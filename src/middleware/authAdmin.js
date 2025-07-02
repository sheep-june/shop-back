const jwt = require("jsonwebtoken");

exports.authAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "管理者トークンがありません。" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 1) {
            return res
                .status(403)
                .json({ message: "管理者権限が必要です。" });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "無効なトークンです。" });
    }
};
