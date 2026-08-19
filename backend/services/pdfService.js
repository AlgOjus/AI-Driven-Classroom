const pdfParse = require("pdf-parse");
const fs = require("fs");

async function extractTextFromFile(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(dataBuffer);
    return { text: parsed.text || "", numPages: parsed.numpages || 1 };
}

// Bigger chunks + hard cap on total chunk count, so large PDFs don't
// generate hundreds of AI calls and hit free-tier rate limits.
function chunkText(text, maxChunks) {
    maxChunks = maxChunks || 25;
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return ["Empty document"];

    let size = 350;
    let totalChunks = Math.ceil(words.length / size);

    if (totalChunks > maxChunks) {
        size = Math.ceil(words.length / maxChunks);
    }

    const chunks = [];
    for (let i = 0; i < words.length; i += size) {
        chunks.push(words.slice(i, i + size).join(" "));
    }
    return chunks;
}

module.exports = { extractTextFromFile, chunkText };