const express = require("express");
const router = express.Router();
const Faq = require("../models/Faq");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const csrf = require("csurf");

const csrfProtection = csrf({
    cookie: {
        httpOnly: false,
        sameSite: "lax",
        secure: false,
    },
    value: (req) => req.headers["x-xsrf-token"],
});

router.get("/", async (req, res) => {
    try {
        const faqs = await Faq.find().populate("admin", "name");
        res.status(200).json(faqs);
    } catch (err) {
        res.status(500).json({ message: "FAQ 조회 실패" });
    }
});

router.post("/", auth, csrfProtection, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 1) {
            return res
                .status(403)
                .json({ message: "관리자만 작성할 수 있습니다." });
        }

        const { title, content } = req.body;

        const faq = new Faq({
            title,
            content,
            admin: user._id,
        });

        await faq.save();
        res.status(201).json(faq);
    } catch (err) {
        console.error("FAQ 작성 실패:", err);
        res.status(500).json({ message: "FAQ 작성 실패" });
    }
});

router.put("/:id", auth, csrfProtection, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 1) {
            return res
                .status(403)
                .json({ message: "관리자만 수정할 수 있습니다." });
        }

        const { title, content } = req.body;

        const updated = await Faq.findByIdAndUpdate(
            req.params.id,
            { title, content },
            { new: true }
        );

        if (!updated) {
            return res
                .status(404)
                .json({ message: "해당 FAQ를 찾을 수 없습니다." });
        }

        res.status(200).json(updated);
    } catch (err) {
        console.error("FAQ 수정 실패:", err);
        res.status(500).json({ message: "FAQ 수정 실패" });
    }
});

router.delete("/:id", auth, csrfProtection, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 1) {
            return res
                .status(403)
                .json({ message: "관리자만 삭제할 수 있습니다." });
        }

        const deleted = await Faq.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res
                .status(404)
                .json({ message: "해당 FAQ를 찾을 수 없습니다." });
        }

        res.status(200).json({ message: "삭제 완료" });
    } catch (err) {
        console.error("FAQ 삭제 실패:", err);
        res.status(500).json({ message: "FAQ 삭제 실패" });
    }
});

module.exports = router;
