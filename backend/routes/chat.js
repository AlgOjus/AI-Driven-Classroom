const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { db, persist, genId } = require("../utils/db");
const { rankChunksForQuestion, answerFromContext } = require("../services/aiService");

router.post("/:sessionId/ask", auth(["student"]), async (req, res) => {
    try {
        const session = db.sessions.find((s) => s.id === req.params.sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });
        const material = db.materials.find((m) => m.id === session.materialId);
        const question = req.body.question || "";

        const ranked = await rankChunksForQuestion(question, material, 4);
        const answer = await answerFromContext(question, ranked, session.summary);

        db.chatlogs.push({
            id: genId(),
            studentId: req.user.id,
            sessionId: session.id,
            question,
            answer,
            createdAt: new Date().toISOString(),
        });
        persist();
        res.json({ answer });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;