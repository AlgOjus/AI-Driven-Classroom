const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { auth } = require("../middleware/auth");
const { db, persist, genId } = require("../utils/db");
const { extractTextFromFile, chunkText } = require("../services/pdfService");
const { analyzeChunk, embedText, HAS_AI } = require("../services/aiService");
const { resolveFlashcards } = require("../services/visualLibrary");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

router.post("/upload/:classroomId", auth(["teacher"]), upload.single("pdf"), async (req, res) => {
    try {
        const classroomId = req.params.classroomId;
        if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

        const filePath = req.file.path;
        const fileUrl = "/uploads/" + path.basename(filePath);

        const extracted = await extractTextFromFile(filePath);
        const rawText = extracted.text;
        const numPages = extracted.numPages;
        const rawChunks = chunkText(rawText, 25); // capped at 25 chunks max

        console.log("📄 PDF split into " + rawChunks.length + " chunks. Processing with AI" + (HAS_AI ? " (this will take ~" + Math.ceil(rawChunks.length * 4.5 / 60) + " min due to free-tier rate limiting)..." : " (heuristic mode)..."));

        const chunks = [];
        for (let i = 0; i < rawChunks.length; i++) {
            console.log("  → Analyzing chunk " + (i + 1) + "/" + rawChunks.length);
            const analysis = await analyzeChunk(rawChunks[i]);
            const flashcards = await resolveFlashcards(analysis.flashcards);
            const embedding = await embedText(rawChunks[i]);
            chunks.push({
                id: genId(),
                page: Math.floor(i / 3) + 1,
                text: rawChunks[i],
                topic: analysis.topic,
                keywords: analysis.keywords,
                flashcards,
                quiz: analysis.quiz || [],
                embedding,
            });

            // Stay under Gemini free-tier rate limit (~15 req/min for text model)
            if (HAS_AI && i < rawChunks.length - 1) {
                await sleep(4500);
            }
        }

        console.log("✅ PDF processing complete: " + chunks.length + " topics analyzed.");

        const material = {
            id: genId(), classroomId, title: req.body.title || req.file.originalname,
            fileUrl, rawText, numPages, chunks, createdAt: new Date().toISOString(),
        };
        db.materials.push(material);

        const post = {
            id: genId(), classroomId, type: "material",
            title: "📄 New Material: " + material.title, materialId: material.id,
            fileUrl, createdAt: new Date().toISOString(),
        };
        db.posts.push(post);
        persist();
        res.json(material);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Upload processing failed: " + e.message });
    }
});

router.get("/:id", auth(), (req, res) => {
    const m = db.materials.find((x) => x.id === req.params.id);
    if (!m) return res.status(404).json({ error: "Not found" });
    const clean = JSON.parse(JSON.stringify(m));
    clean.chunks.forEach((c) => delete c.embedding);
    res.json(clean);
});

module.exports = router;