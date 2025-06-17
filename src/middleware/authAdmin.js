const jwt = require("jsonwebtoken");

exports.authAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "관리자 토큰이 없습니다." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 1) {
            return res
                .status(403)
                .json({ message: "관리자 권한이 필요합니다." });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};
