const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json("管理者トークンがありません。");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 1) {
            return res.status(403).json("管理者権限が必要です。");
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(403).json("無効な管理者トークンです。");
    }
};
