const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ImageAd = require("../models/ImageAd");
const { authAdmin } = require("../middleware/authAdmin");

const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../../uploads/IMGads");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

router.get("/", async (req, res) => {
    try {
        const ads = await ImageAd.find()
            .populate("product")
            .sort({ order: 1, createdAt: -1 });
        res.json(ads);
    } catch (err) {
        console.error("広告イメージ照会エラー", err);
        res.status(500).json({
            message: "広告リストを読み込めませんでした。",
            error: err,
        });
    }
});

router.post("/", authAdmin, upload.single("image"), async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId || !req.file) {
            return res
                .status(400)
                .json({ message: "product Idとimageファイルの両方が必要です。" });
        }

        const maxOrderDoc = await ImageAd.findOne()
            .sort({ order: -1 })
            .select("order");
        const nextOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 1;
        const newAd = new ImageAd({
            product: productId,
            image: `uploads/IMGads/${req.file.filename}`,
            order: nextOrder,
        });

        await newAd.save();
        res.status(201).json(newAd);
    } catch (err) {
        console.error("広告画像アップロードエラー:", err);
        res.status(500).json({
            message: "広告のアップロードに失敗しました。",
            error: err,
        });
    }
});

// router.patch("/order/:id", authAdmin, async (req, res) => {
//     const { id } = req.params;
//     const { direction } = req.body;
//     if (!["up", "down"].includes(direction)) {
//         return res
//             .status(400)
//             .json({ message: "direction 값은 'up' 또는 'down'만 허용됩니다." });
//     }

//     try {
//         const ad = await ImageAd.findById(id);
//         if (!ad)
//             return res
//                 .status(404)
//                 .json({ message: "해당 광고를 찾을 수 없습니다." });

//         if (direction === "up") {
//             const prev = await ImageAd.findOne({ order: ad.order - 1 });
//             if (prev) {
//                 [prev.order, ad.order] = [ad.order, prev.order];
//                 await prev.save();
//             }
//             ad.order -= 1;
//         } else {
//             const next = await ImageAd.findOne({ order: ad.order + 1 });
//             if (next) {
//                 [next.order, ad.order] = [ad.order, next.order];
//                 await next.save();
//             }
//             ad.order += 1;
//         }

//         await ad.save();
//         res.json(ad);
//     } catch (err) {
//         console.error("광고 순서 변경 오류:", err);
//         res.status(500).json({
//             message: "광고 순서 변경에 실패했습니다.",
//             error: err,
//         });
//     }
// });
router.patch("/order/:id", authAdmin, async (req, res) => {
    const { id } = req.params;
    const { direction } = req.body;

    if (!["up", "down"].includes(direction)) {
        return res.status(400).json({
            message: "direction値は、「up」または「down」のみが許可されます。",
        });
    }

    try {
        const ad = await ImageAd.findById(id);
        if (!ad) {
            return res.status(404).json({ message: "その広告が見つかりません。" });
        }

        const targetOrder = direction === "up" ? ad.order - 1 : ad.order + 1;
        const swapAd = await ImageAd
            .findOne({ order: targetOrder })
            .sort({ createdAt: 1 }); // 안정성을 위해 추천

        if (!swapAd) {
            return res.status(400).json({ message: "これ以上移動できません。" });
        }

        const tempOrder = ad.order;
        ad.order = swapAd.order;
        swapAd.order = tempOrder;

        await Promise.all([ad.save(), swapAd.save()]);

        res.json({ message: "順序変更成功", ad });
    } catch (err) {
        console.error("広告順序変更エラー:", err);
        res.status(500).json({
            message: "広告の順番の変更に失敗しました。",
            error: err,
        });
    }
});



router.delete("/:id", authAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const ad = await ImageAd.findByIdAndDelete(id);
        if (!ad)
            return res
                .status(404)
                .json({ message: "削除する広告が見つかりません。" });
        if (ad.image) {
            const filePath = path.join(__dirname, "../../", ad.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.sendStatus(204);
    } catch (err) {
        console.error("広告削除エラー:", err);
        res.status(500).json({
            message: "広告の削除に失敗しました。",
            error: err,
        });
    }
});

module.exports = router;
