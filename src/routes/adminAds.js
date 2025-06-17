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
        if (!product) return res.status(404).json("상품이 존재하지 않습니다.");
        const adCount = await Ad.countDocuments();
        if (adCount >= 5) {
            return res.status(400).json("광고는 최대 5개까지 등록 가능합니다.");
        }

        const ad = new Ad({
            product: productId,
            video: req.file.filename,
        });

        await ad.save();
        res.status(201).json(ad);
    } catch (err) {
        console.error("광고 등록 실패:", err);
        res.status(500).json("서버 오류");
    }
});

router.get("/", async (req, res) => {
    try {
        const ads = await Ad.find().populate("product").sort({ updatedAt: -1 });

        res.json(ads);
    } catch (err) {
        console.error("광고 목록 불러오기 실패:", err);
        res.status(500).json("서버 오류");
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

        res.status(200).json({ message: "광고 순서가 변경되었습니다." });
    } catch (err) {
        console.error("광고 순서 변경 실패:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.delete("/:id", adminAuth, async (req, res) => {
    try {
        await Ad.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "광고 삭제 완료" });
    } catch (err) {
        console.error("광고 삭제 실패:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
