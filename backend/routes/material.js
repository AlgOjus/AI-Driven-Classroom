const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { auth } = require("../middleware/auth");
const { db, persist, genId } = require("../utils/db");
const { extractTextFromFile, chunkText } = require("../services/pdfService");
const { analyzeChunk, embedText } = require("../services/aiService");
const { resolveAllSuggestions } = require("../services/visualLibrary");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/upload/:classroomId", auth(["teacher"]), upload.single("pdf"), async (req, res) => {
    try {
        const classroomId = req.params.classroomId;
        if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

        const filePath = req.file.path;
        const fileUrl = "/uploads/" + path.basename(filePath);

        const rawText = await extractTextFromFile(filePath);
        const rawChunks = chunkText(rawText);

        const chunks = [];
        for (let i = 0; i < rawChunks.length; i++) {
            const analysis = await analyzeChunk(rawChunks[i]);
            const suggestions = await resolveAllSuggestions(analysis.suggestions);
            const embedding = await embedText(rawChunks[i]);
            chunks.push({
                id: genId(),
                page: Math.floor(i / 3) + 1,
                text: rawChunks[i],
                topic: analysis.topic,
                keywords: analysis.keywords,
                suggestions,
                quiz: analysis.quiz || [],
                embedding,
            });
        }

        const material = {
            id: genId(),
            classroomId,
            title: req.body.title || req.file.originalname,
            fileUrl,
            rawText,
            chunks,
            createdAt: new Date().toISOString(),
        };
        db.materials.push(material);

        const post = {
            id: genId(),
            classroomId,
            type: "material",
            title: "📄 New Material: " + material.title,
            materialId: material.id,
            fileUrl,
            createdAt: new Date().toISOString(),
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