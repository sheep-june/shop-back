const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

let auth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "認証ヘッダーなし" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "トークンなし" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user;
        if (decoded.role === 1) {
            user = await Admin.findById(decoded.id);
        } else {
            user = await User.findById(decoded.id);
        }

        if (!user) {
            console.warn("ユーザーが存在しない, decoded.id =", decoded.id);
            return res
                .status(401)
                .json({ message: "ユーザーなしまたは無効なトークン" });
        }

        req.user = {
            ...user.toObject(),
            id: user._id.toString(),
            role: decoded.role,
        };

        next();
    } catch (error) {
        console.error("auth ミドルウェアエラー:", error);
        return res.status(401).json({ message: "トークン検証失敗" });
    }
};

module.exports = auth;
