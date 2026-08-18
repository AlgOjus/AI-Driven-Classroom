const HAS_AI = !!process.env.OPENAI_API_KEY;
let OpenAIClient = null;

if (HAS_AI) {
    try {
        const OpenAI = require("openai");
        OpenAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log("✅ AI mode: ENABLED (OpenAI)");
    } catch (e) {
        console.log("⚠️ OpenAI package missing. Run: npm install openai");
    }
} else {
    console.log("ℹ️ AI mode: HEURISTIC (no OPENAI_API_KEY set). App still fully functional.");
}

const STOPWORDS = new Set([
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "of", "to", "in", "it", "that",
    "this", "for", "with", "as", "are", "was", "were", "be", "by", "from", "has", "have",
    "had", "will", "can", "its", "their"
]);

function extractKeywords(text, n) {
    n = n || 6;
    const freq = {};
    text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).forEach((w) => {
        if (w.length > 3 && !STOPWORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);
}

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildFallbackQuiz(topic, keywords) {
    const kws = keywords && keywords.length ? keywords : [topic];
    const count = Math.min(4, Math.max(1, kws.length));
    const qs = [];
    for (let i = 0; i < count; i++) {
        const correct = kws[i] || topic;
        const pool = kws.filter((k) => k !== correct);
        const options = [
            correct,
            pool[0] || "Unrelated Concept " + (i + 1),
            pool[1] || "Different Chapter Topic",
            pool[2] || "Random Fact",
        ];
        const shuffled = shuffleArray(options);
        qs.push({
            question: 'Which of these was discussed in relation to "' + topic + '"?',
            options: shuffled,
            answerIndex: shuffled.indexOf(correct),
        });
    }
    return qs;
}

function buildFallbackFlashcards(topic, keywords) {
    const kws = keywords && keywords.length ? keywords : [topic];
    const labels = { "3d": "3D Model", animation: "Animation", simulation: "Simulation" };
    const result = {};
    ["3d", "animation", "simulation"].forEach((type) => {
        result[type] = [0, 1].map((i) => {
            const kw = kws[i % kws.length] || topic;
            return {
                title: kw.charAt(0).toUpperCase() + kw.slice(1) + " — " + labels[type],
                description: 'Explore a ' + labels[type].toLowerCase() + ' illustrating "' + kw + '" from this part of the lesson.',
                query: kw + " " + topic,
            };
        });
    });
    return result;
}

async function embedText(text) {
    if (!HAS_AI || !OpenAIClient) return null;
    try {
        const res = await OpenAIClient.embeddings.create({
            model: "text-embedding-3-small",
            input: text.slice(0, 8000),
        });
        return res.data[0].embedding;
    } catch (e) {
        console.log("embed error:", e.message);
        return null;
    }
}

function cosineSim(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function keywordOverlapScore(text, chunk) {
    const words = new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/));
    let score = 0;
    (chunk.keywords || []).forEach((k) => { if (words.has(k)) score++; });
    return score;
}

async function analyzeChunk(text) {
    if (HAS_AI && OpenAIClient) {
        try {
            const prompt =
                "Analyze this textbook passage for a teaching app. Return STRICT JSON only with keys: " +
                "topic (short string), keywords (array of 5 lowercase strings), " +
                "flashcards (object with keys '3d','animation','simulation', each an array of exactly 2 objects shaped as " +
                "{title: short catchy title, description: 1-2 sentence description of what this visualization would show, query: short search phrase}), " +
                "quiz (array of exactly 4 objects shaped as {question: string, options: array of exactly 4 strings, answerIndex: number 0-3}). " +
                "Passage: " + text.slice(0, 1500);
            const res = await OpenAIClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });
            const parsed = JSON.parse(res.choices[0].message.content);
            if (parsed.topic && parsed.flashcards && parsed.flashcards["3d"] && parsed.flashcards.animation && parsed.flashcards.simulation) {
                if (!parsed.quiz || !parsed.quiz.length) parsed.quiz = buildFallbackQuiz(parsed.topic, parsed.keywords || []);
                return parsed;
            }
        } catch (e) {
            console.log("analyzeChunk AI failed, using fallback:", e.message);
        }
    }
    const keywords = extractKeywords(text);
    const topic = keywords.slice(0, 3).join(" ") || "General Topic";
    return {
        topic,
        keywords,
        flashcards: buildFallbackFlashcards(topic, keywords),
        quiz: buildFallbackQuiz(topic, keywords),
    };
}

async function generateSummary(rawText, transcript, matchedTopics) {
    if (HAS_AI && OpenAIClient) {
        try {
            const prompt =
                "Create a structured class summary for students who may have missed class. " +
                "Sections required: 'Topics Covered', 'Key Explanations', 'Visuals/Demos Shown', 'Important Definitions', " +
                "'3 Practice Questions'. Base it primarily on the TRANSCRIPT, using the PDF as backup context.\n\n" +
                "PDF CONTENT:\n" + rawText.slice(0, 3000) +
                "\n\nTRANSCRIPT:\n" + (transcript || "(no transcript captured)").slice(0, 3000) +
                "\n\nVISUALS SHOWN:\n" + JSON.stringify(matchedTopics);
            const res = await OpenAIClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });
            return res.choices[0].message.content;
        } catch (e) {
            console.log("generateSummary AI failed, using fallback:", e.message);
        }
    }
    const topics = Array.from(new Set(matchedTopics.map((t) => t.topic)));
    return (
        "## Class Summary (auto-generated)\n\n**Topics Covered:**\n" +
        (topics.length ? topics.map((t) => "- " + t).join("\n") : "- General overview of the material") +
        "\n\n**Transcript Excerpt:**\n" +
        (transcript ? transcript.slice(0, 800) : "No voice transcript was captured this session.") +
        "\n\n**Note:** Set OPENAI_API_KEY for richer AI-generated summaries."
    );
}

async function answerFromContext(question, chunks, summary) {
    if (HAS_AI && OpenAIClient) {
        try {
            const context = chunks.map((c, i) => "[" + i + "] " + c.text).join("\n\n");
            const prompt =
                "You are a classroom AI tutor. Answer using ONLY the class content below, in the same terms the teacher used. " +
                "If not covered, say so honestly, then give a brief general answer flagged as outside class content.\n\n" +
                "CLASS SUMMARY:\n" + (summary || "N/A") + "\n\nRELEVANT SOURCE CHUNKS:\n" + context +
                "\n\nSTUDENT QUESTION: " + question;
            const res = await OpenAIClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });
            return res.choices[0].message.content;
        } catch (e) {
            console.log("answerFromContext AI failed, using fallback:", e.message);
        }
    }
    if (!chunks.length) return "I couldn't find this in the class content yet. Try asking after the teacher covers it.";
    return "Based on what was covered in class:\n\n" + chunks.map((c) => "- " + c.text).join("\n\n");
}

async function matchTranscriptToChunk(transcriptChunk, material) {
    const canEmbed = HAS_AI && material.chunks.length && material.chunks.every((c) => c.embedding);
    if (canEmbed) {
        const emb = await embedText(transcriptChunk);
        if (emb) {
            let best = null, bestScore = -1;
            material.chunks.forEach((c) => {
                const score = cosineSim(emb, c.embedding);
                if (score > bestScore) { bestScore = score; best = c; }
            });
            return { chunk: best, score: bestScore, threshold: 0.55 };
        }
    }
    let best = null, bestScore = -1;
    material.chunks.forEach((c) => {
        const score = keywordOverlapScore(transcriptChunk, c);
        if (score > bestScore) { bestScore = score; best = c; }
    });
    return { chunk: best, score: bestScore, threshold: 1 };
}

async function rankChunksForQuestion(question, material, topN) {
    topN = topN || 4;
    const canEmbed = HAS_AI && material.chunks.length && material.chunks.every((c) => c.embedding);
    if (canEmbed) {
        const emb = await embedText(question);
        if (emb) {
            return material.chunks
                .map((c) => Object.assign({}, c, { score: cosineSim(emb, c.embedding) }))
                .sort((a, b) => b.score - a.score).slice(0, topN);
        }
    }
    return material.chunks
        .map((c) => Object.assign({}, c, { score: keywordOverlapScore(question, c) }))
        .sort((a, b) => b.score - a.score).slice(0, topN);
}

module.exports = {
    HAS_AI, embedText, cosineSim, analyzeChunk, generateSummary,
    answerFromContext, matchTranscriptToChunk, rankChunksForQuestion,
};