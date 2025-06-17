const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const async = require("async");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: true });

router.get("/csrf-token", csrfProtection, (req, res) => {
    return res.status(200).json({ csrfToken: req.csrfToken() });
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

router.get("/auth", auth, async (req, res) => {
    return res.status(200).json({
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        image: req.user.image,
        cart: req.user.cart,
        history: req.user.history,
    });
});

router.post(
    "/register",
    authLimiter,
    [
        body("email").isEmail().withMessage("유효한 이메일을 입력하세요."),
        body("password")
            .isLength({ min: 6 })
            .withMessage("비밀번호는 최소 6자 이상이어야 합니다."),
        body("name").notEmpty().withMessage("이름을 입력하세요."),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = new User(req.body);
            await user.save();
            return res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/login",
    authLimiter,
    [
        body("email").isEmail().withMessage("유효한 이메일을 입력하세요."),
        body("password").notEmpty().withMessage("비밀번호를 입력하세요."),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user)
                return res.status(400).send("Auth failed, email not found");

            const isMatch = await user.comparePassword(req.body.password);
            if (!isMatch) return res.status(400).send("Wrong password");

            const payload = {
                id: user._id.toHexString(),
                role: Number(user.role),
            };
            const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });

            return res.json({ user, accessToken });
        } catch (error) {
            next(error);
        }
    }
);

router.post("/logout", auth, async (req, res, next) => {
    try {
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.post("/cart", auth, async (req, res, next) => {
    try {
        const userInfo = await User.findOne({ _id: req.user._id });
        let duplicate = false;
        userInfo.cart.forEach((item) => {
            if (item.id === req.body.productId) duplicate = true;
        });

        if (duplicate) {
            const user = await User.findOneAndUpdate(
                { _id: req.user._id, "cart.id": req.body.productId },
                { $inc: { "cart.$.quantity": 1 } },
                { new: true }
            );
            return res.status(201).send(user.cart);
        } else {
            const user = await User.findOneAndUpdate(
                { _id: req.user._id },
                {
                    $push: {
                        cart: {
                            id: req.body.productId,
                            quantity: 1,
                            date: Date.now(),
                        },
                    },
                },
                { new: true }
            );
            return res.status(201).send(user.cart);
        }
    } catch (error) {
        next(error);
    }
});

router.delete("/cart", auth, async (req, res, next) => {
    try {
        const userInfo = await User.findOneAndUpdate(
            { _id: req.user._id },
            { $pull: { cart: { id: req.query.productId } } },
            { new: true }
        );
        const cart = userInfo.cart;
        const array = cart.map((item) => item.id);
        const productInfo = await Product.find({
            _id: { $in: array },
        }).populate("writer");

        return res.json({ productInfo, cart });
    } catch (error) {
        next(error);
    }
});

router.get("/cart", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const cart = user.cart;
        const cartItemIds = cart.map((item) => item.id);
        const cartDetail = await Product.find({ _id: { $in: cartItemIds } });

        const merged = cartDetail.map((product) => {
            const matched = cart.find(
                (item) => item.id.toString() === product._id.toString()
            );
            return { ...product.toObject(), quantity: matched?.quantity || 0 };
        });

        res.json({ cart, cartDetail: merged });
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 오류");
    }
});

router.put("/cart/quantity", auth, async (req, res) => {
    try {
        const { productId, type, quantity } = req.body;
        const user = await User.findById(req.user._id);
        const cartItem = user.cart.find(
            (item) => item.id.toString() === productId.toString()
        );

        if (!cartItem)
            return res.status(404).send("상품이 장바구니에 없습니다.");

        if (type === "inc") {
            cartItem.quantity += 1;
        } else if (type === "dec") {
            cartItem.quantity = Math.max(1, cartItem.quantity - 1);
        } else if (type === "set") {
            cartItem.quantity = Math.max(1, parseInt(quantity));
        }

        await user.save();

        const cartItemIds = user.cart.map((item) => item.id);
        const productList = await Product.find({ _id: { $in: cartItemIds } });
        const cartDetail = productList.map((product) => {
            const match = user.cart.find(
                (item) => item.id.toString() === product._id.toString()
            );
            return { ...product.toObject(), quantity: match?.quantity || 0 };
        });

        return res.status(200).json({ cart: user.cart, cartDetail });
    } catch (err) {
        console.error("수량 변경 실패:", err);
        return res.status(500).send("수량 변경 실패");
    }
});

router.post("/payment", auth, async (req, res) => {
    try {
        const { cartDetail } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send("유저 없음");

        const history = [];
        const paidIds = [];

        cartDetail.forEach((item) => {
            history.push({
                dateOfPurchase: new Date().toISOString(),
                name: item.title,
                id: item._id,
                price: item.price * item.quantity,
                quantity: item.quantity,
                paymentId: crypto.randomUUID(),
            });
            paidIds.push(item._id);
        });

        const transactionData = {
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
            product: history,
        };

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: { history: { $each: history } },
                $pull: { cart: { id: { $in: paidIds } } },
            },
            { new: true }
        );

        const payment = new Payment(transactionData);
        const saved = await payment.save();

        await Promise.all(
            saved.product.map((item) =>
                Product.updateOne(
                    { _id: item.id },
                    { $inc: { sold: item.quantity } }
                )
            )
        );

        res.sendStatus(200);
    } catch (err) {
        console.error("결제 오류:", err);
        res.status(500).send("결제 처리 중 오류 발생");
    }
});

router.post("/wishlist", auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.body.productId;

        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ message: "이미 찜한 상품입니다." });
        }

        user.wishlist.push(productId);
        await user.save();
        return res.status(200).json({ wishlist: user.wishlist });
    } catch (error) {
        next(error);
    }
});

router.delete("/wishlist", auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.query.productId;

        user.wishlist = user.wishlist.filter(
            (id) => id.toString() !== productId
        );
        await user.save();
        return res.status(200).json({ wishlist: user.wishlist });
    } catch (error) {
        next(error);
    }
});

router.get("/wishlist", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send("유저를 찾을 수 없습니다.");

        const products = await Product.find({ _id: { $in: user.wishlist } });
        res.json({ products });
    } catch (err) {
        console.error("찜 목록 불러오기 실패:", err);
        res.status(500).send("서버 오류");
    }
});

router.post("/cart/batch", auth, async (req, res) => {
    try {
        const { productIds } = req.body;
        if (!Array.isArray(productIds)) {
            return res
                .status(400)
                .json({ message: "상품 ID 배열이 필요합니다." });
        }

        const user = await User.findById(req.user.id);
        productIds.forEach((pid) => {
            const exists = user.cart.some((item) => item.id === pid);
            if (!exists) {
                user.cart.push({ id: pid, quantity: 1 });
            }
        });

        await user.save();
        res.json(user.cart);
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 오류");
    }
});

router.delete("/wishlist/batch", auth, async (req, res) => {
    try {
        const { productIds } = req.body;
        if (!Array.isArray(productIds)) {
            return res
                .status(400)
                .json({ message: "상품 ID 배열이 필요합니다." });
        }

        const user = await User.findById(req.user.id);
        user.wishlist = user.wishlist.filter(
            (pid) => !productIds.includes(String(pid))
        );

        await user.save();
        res.send("삭제 성공");
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 오류");
    }
});

router.get("/myproducts", auth, async (req, res) => {
    try {
        const products = await Product.find({ writer: req.user._id }).sort({
            createdAt: -1,
        });
        return res.status(200).json({ products });
    } catch (error) {
        console.error("내가 올린 상품 불러오기 실패:", error);
        return res.status(500).send("서버 오류");
    }
});

module.exports = router;
