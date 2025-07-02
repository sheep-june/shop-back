const express = require("express");
const router = express.Router();
const Faq = require("../models/Faq");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");



router.get("/", async (req, res) => {
    try {
        const faqs = await Faq.find().populate("admin", "name");
        res.status(200).json(faqs);
    } catch (err) {
        res.status(500).json({ message: "FAQ 照会失敗" });
    }
});

// router.post("/", auth, csrfProtection, async (req, res) => {
router.post("/", auth, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 1) {
            return res
                .status(403)
                .json({ message: "管理者のみ作成できます。" });
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
        console.error("FAQ 作成失敗:", err);
        res.status(500).json({ message: "FAQ 作成失敗" });
    }
});

// router.put("/:id", auth, csrfProtection, async (req, res) => {
router.put("/:id", auth, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 1) {
            return res
                .status(403)
                .json({ message: "管理者のみ修正できます。" });
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
                .json({ message: "該当するFAQが見つかりません。" });
        }

        res.status(200).json(updated);
    } catch (err) {
        console.error("FAQ 修正失敗", err);
        res.status(500).json({ message: "FAQ 修正失敗" });
    }
});

// router.delete("/:id", auth, csrfProtection, async (req, res) => {
router.delete("/:id", auth, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 1) {
            return res
                .status(403)
                .json({ message: "管理者のみ削除できます。" });
        }

        const deleted = await Faq.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res
                .status(404)
                .json({ message: "該当するFAQが見つかりません。" });
        }

        res.status(200).json({ message: "削除済み" });
    } catch (err) {
        console.error("FAQ 削除失敗:", err);
        res.status(500).json({ message: "FAQ 削除失敗" });
    }
});

module.exports = router;
