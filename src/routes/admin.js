const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const User = require("../models/User");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");
const adminAuth = require("../middleware/adminAuth");

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json("メールが存在しません。");

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json("パスワードが間違っています。");

        const payload = {
            id: admin._id,
            role: 1,
            name: admin.name,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.json({ token, admin });
    } catch (err) {
        console.error("管理者ログイン失敗:", err);
        res.status(500).json("サーバーエラー");
    }
});

router.get("/users", adminAuth, async (req, res) => {
    try {
        const users = await User.find({}, "_id name email");
        res.json(users);
    } catch (err) {
        res.status(500).json("ユーザー リストの読み込みに失敗しました。");
    }
});

router.get("/posts", adminAuth, async (req, res) => {
    try {
        const posts = await Product.find({}, "_id title description");
        res.json(posts);
    } catch (err) {
        res.status(500).json("投稿リストの読み込みに失敗しました。");
    }
});

router.delete("/users/:id", adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json("ユーザーの削除に失敗しました。");
    }
});

router.delete("/posts/:id", adminAuth, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json("投稿の削除に失敗しました。");
    }
});

module.exports = router;
