const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");

router.post("/", auth, async (req, res) => {
    const { productId, rating, comment } = req.body;

    try {
        const user = await User.findById(req.user._id);

        const hasPurchased = user.history.some(
            (item) => item.id.toString() === productId
        );
        if (!hasPurchased) {
            return res.status(403).json({ message: "구매한 사용자만 리뷰 작성 가능" });
        }

        const existingReview = await Review.findOne({
            product: productId,
            user: req.user._id,
        });
        if (existingReview) {
            return res.status(400).json({ message: "이미 리뷰를 작성하셨습니다." });
        }

        const review = new Review({
            product: productId,
            user: req.user._id,
            rating,
            comment,
        });
        await review.save();

        const reviews = await Review.find({ product: productId });
        const avgRating =
            reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            rating: avgRating,
            numReviews: reviews.length,
        });

        res.status(201).json(review);
    } catch (err) {
        console.error(err);
        res.status(500).json("리뷰 저장 실패");
    }
});

router.get("/:productId", async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ product: productId }).populate("user", "name");
        const total = reviews.length;
        const averageRating = total > 0
            ? reviews.reduce((acc, cur) => acc + cur.rating, 0) / total
            : 0;

        res.json({
            reviews,
            averageRating,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("리뷰 불러오기 실패");
    }
});

module.exports = router;
