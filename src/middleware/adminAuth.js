const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json("관리자 토큰이 없습니다.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 1) {
            return res.status(403).json("관리자 권한이 필요합니다.");
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(403).json("유효하지 않은 관리자 토큰입니다.");
    }
};
