const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Comment = require("../models/Comment");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.get("/", async (req, res) => {
    try {
        const questions = await Question.find()
            .populate("user", "name")
            .sort({ createdAt: -1 });

        const comments = await Comment.find().populate("admin", "name");

        const result = questions.map((q) => {
            const comment = comments.find(
                (c) => c.question.toString() === q._id.toString()
            );
            return {
                ...q.toObject(),
                comment: comment || null,
            };
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "質問照会失敗" });
    }
});

// router.post("/", auth, csrfProtection, async (req, res) => {
router.post("/", auth, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 0) {
            return res
                .status(403)
                .json({ message: "一般ユーザーのみ質問作成可能" });
        }

        const { title, content } = req.body;

        const question = new Question({
            title,
            content,
            user: user._id,
        });

        await question.save();
        res.status(201).json(question);
    } catch (err) {
        console.error("質問作成失敗:", err);
        res.status(500).json({ message: "質問作成失敗" });

    }
});

// router.post("/:id/comment", adminAuth, csrfProtection, async (req, res) => {
router.post("/:id/comment", adminAuth, async (req, res) => {
    try {
        const admin = req.admin;
        const { content } = req.body;
        const questionId = req.params.id;

        const comment = new Comment({
            question: questionId,
            content,
            admin: admin.id,
        });

        await comment.save();
        res.status(201).json(comment);
    } catch (err) {
        console.error("コメント保存失敗", err);
        res.status(500).json({ message: "コメント作成失敗" });
    }
});

// router.put("/reply/:replyId", adminAuth, csrfProtection, async (req, res) => {
router.put("/reply/:replyId", adminAuth, async (req, res) => {
    try {
        const { content } = req.body;
        const updated = await Comment.findByIdAndUpdate(
            req.params.replyId,
            { content },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "コメントなし" });
        res.status(200).json({ message: "コメント修正完了" });
    } catch (err) {
        res.status(500).json({ message: "コメント修正失敗" });
    }
});

// router.delete("/reply/:replyId", adminAuth, csrfProtection, async (req, res) => {
router.delete("/reply/:replyId", adminAuth, async (req, res) => {
    try {
        const deleted = await Comment.findByIdAndDelete(req.params.replyId);
        if (!deleted) return res.status(404).json({ message: "コメントなし" });
        res.status(200).json({ message: "コメント削除完了" });
    } catch (err) {
        res.status(500).json({ message: "コメント削除失敗" });
    }
});

// router.delete("/:id", adminAuth, csrfProtection, async (req, res) => {
router.delete("/:id", adminAuth, async (req, res) => {
    try {
        const deleted = await Question.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "質問なし" });

        await Comment.deleteOne({ question: req.params.id });

        res.status(200).json({ message: "質問削除済み" });
    } catch (err) {
        res.status(500).json({ message: "質問削除失敗" });
    }
});

module.exports = router;
