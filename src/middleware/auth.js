const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

let auth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "인증 헤더 없음" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "토큰 없음" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user;
        if (decoded.role === 1) {
            user = await Admin.findById(decoded.id);
        } else {
            user = await User.findById(decoded.id);
        }

        if (!user) {
            console.warn(" 유저가 존재하지 않음, decoded.id =", decoded.id);
            return res
                .status(401)
                .json({ message: "유저 없음 또는 잘못된 토큰" });
        }

        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            role: decoded.role,
        };

        next();
    } catch (error) {
        console.error("auth 미들웨어 오류:", error);
        return res.status(401).json({ message: "토큰 검증 실패" });
    }
};

module.exports = auth;
