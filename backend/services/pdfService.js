const pdfParse = require("pdf-parse");
const fs = require("fs");

async function extractTextFromFile(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(dataBuffer);
    return { text: parsed.text || "", numPages: parsed.numpages || 1 };
}

function chunkText(text, size) {
    size = size || 180;
    const words = text.split(/\s+/).filter(Boolean);
    const chunks = [];
    for (let i = 0; i < words.length; i += size) {
        chunks.push(words.slice(i, i + size).join(" "));
    }
    return chunks.length ? chunks : [text || "Empty document"];
}

module.exports = { extractTextFromFile, chunkText };