const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Ad = require("../models/Ad");
const Product = require("../models/Product");
const adminAuth = require("../middleware/adminAuth");
const { authAdmin } = require("../middleware/authAdmin");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../../uploads/ads"));
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
});

router.post("/", adminAuth, upload.single("video"), async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json("商品が存在しません。");
        const adCount = await Ad.countDocuments();
        if (adCount >= 5) {
            return res.status(400).json("広告は最大5つまで登録可能です。");
        }

        const ad = new Ad({
            product: productId,
            video: req.file.filename,
        });

        await ad.save();
        res.status(201).json(ad);
    } catch (err) {
        console.error("広告登録失敗:", err);
        res.status(500).json("サーバーエラー");
    }
});

router.get("/", async (req, res) => {
    try {
        const ads = await Ad.find().populate("product").sort({ updatedAt: -1 });

        res.json(ads);
    } catch (err) {
        console.error("広告リストの読み込みに失敗:", err);
        res.status(500).json("サーバーエラー");
    }
});

router.post("/reorder", authAdmin, async (req, res) => {
    try {
        const { ads } = req.body;

        const updated = await Promise.all(
            ads.map((id, idx) =>
                Ad.findByIdAndUpdate(id, {
                    $set: { updatedAt: new Date(Date.now() + idx) },
                })
            )
        );

        res.status(200).json({ message: "広告の順番が変更されました。" });
    } catch (err) {
        console.error("広告順序変更失敗:", err);
        res.status(500).json({ message: "サーバーエラー" });
    }
});

router.delete("/:id", adminAuth, async (req, res) => {
    try {
        await Ad.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "広告削除完了" });
    } catch (err) {
        console.error("広告削除失敗:", err);
        res.status(500).json({ message: "サーバーエラー" });
    }
});

module.exports = router;
