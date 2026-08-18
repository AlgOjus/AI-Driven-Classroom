const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { db, persist, genId } = require("../utils/db");
const { matchTranscriptToChunk, generateSummary } = require("../services/aiService");

router.post("/start", auth(["teacher"]), (req, res) => {
    const session = {
        id: genId(), classroomId: req.body.classroomId, materialId: req.body.materialId,
        teacherId: req.user.id, transcript: "", matchedTopics: [], summary: "",
        status: "live", createdAt: new Date().toISOString(),
    };
    db.sessions.push(session);
    persist();
    res.json(session);
});

router.post("/:id/match", auth(["teacher"]), async (req, res) => {
    try {
        const session = db.sessions.find((s) => s.id === req.params.id);
        if (!session) return res.status(404).json({ error: "Session not found" });
        const material = db.materials.find((m) => m.id === session.materialId);
        const transcriptChunk = req.body.transcriptChunk || "";
        session.transcript += " " + transcriptChunk;

        const result = await matchTranscriptToChunk(transcriptChunk, material);
        let response = { matched: false };
        if (result.chunk && result.score >= result.threshold) {
            session.matchedTopics.push({ topic: result.chunk.topic, timestamp: new Date().toISOString() });
            response = {
                matched: true, topic: result.chunk.topic, score: result.score,
                flashcards: result.chunk.flashcards, quiz: result.chunk.quiz || [],
            };
        }
        persist();
        res.json(response);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

router.post("/:id/summary", auth(["teacher"]), async (req, res) => {
    try {
        const session = db.sessions.find((s) => s.id === req.params.id);
        if (!session) return res.status(404).json({ error: "Session not found" });
        const material = db.materials.find((m) => m.id === session.materialId);
        const summary = await generateSummary(material.rawText, session.transcript, session.matchedTopics);
        session.summary = summary;
        const post = {
            id: genId(), classroomId: session.classroomId, type: "summary",
            title: "🧠 AI Class Summary (in-progress): " + material.title, content: summary,
            sessionId: session.id, materialId: material.id, createdAt: new Date().toISOString(),
        };
        db.posts.push(post);
        persist();
        res.json({ summary });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

router.post("/:id/end", auth(["teacher"]), async (req, res) => {
    try {
        const session = db.sessions.find((s) => s.id === req.params.id);
        if (!session) return res.status(404).json({ error: "Session not found" });
        const material = db.materials.find((m) => m.id === session.materialId);
        const summary = await generateSummary(material.rawText, session.transcript, session.matchedTopics);
        session.summary = summary;
        session.status = "ended";
        const post = {
            id: genId(), classroomId: session.classroomId, type: "summary",
            title: "🧠 AI Class Summary: " + material.title, content: summary,
            sessionId: session.id, materialId: material.id, createdAt: new Date().toISOString(),
        };
        db.posts.push(post);
        persist();
        res.json({ summary });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Bonus: teacher can push a quiz directly to the classroom stream for students to attempt
router.post("/:id/post-quiz", auth(["teacher"]), (req, res) => {
    try {
        const session = db.sessions.find((s) => s.id === req.params.id);
        if (!session) return res.status(404).json({ error: "Session not found" });
        const { topic, quiz } = req.body;
        const post = {
            id: genId(), classroomId: session.classroomId, type: "quiz",
            title: "📝 Quiz: " + (topic || "Practice Questions"), quiz: quiz || [],
            sessionId: session.id, createdAt: new Date().toISOString(),
        };
        db.posts.push(post);
        persist();
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;