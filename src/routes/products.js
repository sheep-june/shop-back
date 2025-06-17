const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const Review = require("../models/Review");

const storage = multer.diskStorage({
    // destination: (req, file, cb) => cb(null, "uploads/"),
    destination: (req, file, cb) =>
        cb(null, path.join(__dirname, "../../uploads")),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage }).single("file");

router.post("/image", auth, (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).send(err);
        return res.json({ fileName: res.req.file.filename });
    });
});

router.get("/:id", async (req, res, next) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        const product = await Product.findById(req.params.id).populate(
            "writer"
        );
        const reviews = await Review.find({ product: req.params.id }).populate(
            "user",
            "name"
        );
        const averageRating = reviews.length
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : 0;
        if (req.query.type === "single") {
            return res.status(200).json([
                {
                    ...product.toObject(),
                    reviews,
                    averageRating,
                },
            ]);
        }
        return res.status(200).json({
            product,
            reviews,
            averageRating,
        });
    } catch (error) {
        next(error);
    }
});

router.get("/", async (req, res) => {
    try {
        const { skip = 0, limit = 20, searchTerm = "", sort } = req.query;
        let filters = {};

        if (typeof req.query.filters === "string") {
            // filters = JSON.parse(req.query.filters);
            try {
                if (typeof req.query.filters === "string") {
                    filters = JSON.parse(req.query.filters);
                }
            } catch (e) {
                console.error("❌ filters 파싱 실패:", e.message);
                filters = {};
            }
        } else if (typeof req.query.filters === "object") {
            filters = req.query.filters;
        }

        const query = {};

        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
            ];
        }

        if (filters.continents && filters.continents.length > 0) {
            query.category = { $in: filters.continents };
        }

        if (filters.price && filters.price.length === 2) {
            query.price = {
                $gte: filters.price[0],
                $lte: filters.price[1],
            };
        }

        const rawProducts = await Product.find(query)
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const productsWithRating = await Promise.all(
            rawProducts.map(async (product) => {
                const reviews = await Review.find({ product: product._id });
                const avg =
                    reviews.reduce((acc, r) => acc + r.rating, 0) /
                    (reviews.length || 1);
                return {
                    ...product._doc,
                    averageRating: reviews.length
                        ? parseFloat(avg.toFixed(1))
                        : 0,
                };
            })
        );

        let sorted = [...productsWithRating];
        switch (sort) {
            case "views":
                sorted.sort((a, b) => b.views - a.views);
                break;
            case "rating":
                sorted.sort((a, b) => b.averageRating - a.averageRating);
                break;
            case "lowPrice":
                sorted.sort((a, b) => a.price - b.price);
                break;
            case "highPrice":
                sorted.sort((a, b) => b.price - a.price);
                break;
            case "sold":
                sorted.sort((a, b) => b.sold - a.sold);
                break;
            default:
                sorted.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
        }

        const totalCount = await Product.countDocuments(query);
        const hasMore = parseInt(skip) + parseInt(limit) < totalCount;

        res.status(200).json({
            products: sorted,
            hasMore,
            totalCount,
        });
    } catch (err) {
        console.error(" 상품 목록 조회 실패:", err);
        res.status(400).send("상품 목록 조회 실패");
    }
});

router.post("/", auth, async (req, res, next) => {
    try {
        const product = new Product(req.body);
        await product.save();
        return res.sendStatus(201);
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("상품을 찾을 수 없습니다.");
        if (product.writer.toString() !== req.user._id.toString()) {
            return res.status(403).send("삭제 권한이 없습니다.");
        }

        await Product.findByIdAndDelete(req.params.id);
        res.send("상품이 삭제되었습니다.");
    } catch (err) {
        console.error("상품 삭제 오류:", err);
        res.status(500).send("서버 오류로 삭제에 실패했습니다.");
    }
});

router.put("/:id", auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("상품을 찾을 수 없습니다.");
        if (product.writer.toString() !== req.user._id.toString()) {
            return res.status(403).send("수정 권한이 없습니다.");
        }

        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.send("상품이 수정되었습니다.");
    } catch (err) {
        res.status(500).send("상품 수정 실패");
    }
});

module.exports = router;
