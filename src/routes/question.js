const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Comment = require("../models/Comment");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
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
        res.status(500).json({ message: "질문 조회 실패" });
    }
});

router.post("/", auth, csrfProtection, async (req, res) => {
    try {
        const user = req.user;

        if (!user || user.role !== 0) {
            return res
                .status(403)
                .json({ message: "일반 유저만 질문 작성 가능" });
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
        console.error("질문 작성 실패:", err);
        res.status(500).json({ message: "질문 작성 실패" });

    }
});

router.post("/:id/comment", adminAuth, csrfProtection, async (req, res) => {
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
        console.error("댓글 저장 실패:", err);
        res.status(500).json({ message: "댓글 작성 실패" });
    }
});

router.put("/reply/:replyId", adminAuth, csrfProtection, async (req, res) => {
    try {
        const { content } = req.body;
        const updated = await Comment.findByIdAndUpdate(
            req.params.replyId,
            { content },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "댓글 없음" });
        res.status(200).json({ message: "댓글 수정 완료" });
    } catch (err) {
        res.status(500).json({ message: "댓글 수정 실패" });
    }
});

router.delete("/reply/:replyId", adminAuth, csrfProtection, async (req, res) => {
    try {
        const deleted = await Comment.findByIdAndDelete(req.params.replyId);
        if (!deleted) return res.status(404).json({ message: "댓글 없음" });
        res.status(200).json({ message: "댓글 삭제 완료" });
    } catch (err) {
        res.status(500).json({ message: "댓글 삭제 실패" });
    }
});

router.delete("/:id", adminAuth, csrfProtection, async (req, res) => {
    try {
        const deleted = await Question.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "질문 없음" });

        await Comment.deleteOne({ question: req.params.id });

        res.status(200).json({ message: "질문 삭제 완료" });
    } catch (err) {
        res.status(500).json({ message: "질문 삭제 실패" });
    }
});

module.exports = router;
