const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "..", "db.json");

function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({
            users: [], classrooms: [], materials: [], sessions: [], posts: [], chatlogs: []
        }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

let db = loadDB();

function persist() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function genCode() {
    let code;
    do {
        code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (db.classrooms.some((c) => c.classCode === code));
    return code;
}

module.exports = { db, persist, genId, genCode };