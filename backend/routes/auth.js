const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, persist, genId } = require("../utils/db");
const { JWT_SECRET } = require("../middleware/auth");

router.post("/signup", (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "All fields required" });
    }
    if (db.users.find((u) => u.email === email)) {
        return res.status(400).json({ error: "Email already registered" });
    }
    const hash = bcrypt.hashSync(password, 10);
    const user = { id: genId(), name, email, password: hash, role, createdAt: new Date().toISOString() };
    db.users.push(user);
    persist();
    res.json({ success: true });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find((u) => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, id: user.id, name: user.name, role: user.role });
});

module.exports = router;