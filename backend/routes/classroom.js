const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { db, persist, genId, genCode } = require("../utils/db");

router.post("/create", auth(["teacher"]), (req, res) => {
    const classroom = {
        id: genId(),
        name: req.body.name,
        section: req.body.section || "",
        teacherId: req.user.id,
        teacherName: req.user.name,
        classCode: genCode(),
        students: [],
        createdAt: new Date().toISOString(),
    };
    db.classrooms.push(classroom);
    persist();
    res.json(classroom);
});

router.post("/join", auth(["student"]), (req, res) => {
    const code = (req.body.code || "").toUpperCase();
    const classroom = db.classrooms.find((c) => c.classCode === code);
    if (!classroom) return res.status(404).json({ error: "Invalid class code" });
    if (classroom.students.indexOf(req.user.id) === -1) classroom.students.push(req.user.id);
    persist();
    res.json(classroom);
});

router.get("/mine", auth(), (req, res) => {
    let list;
    if (req.user.role === "teacher") {
        list = db.classrooms.filter((c) => c.teacherId === req.user.id);
    } else {
        list = db.classrooms.filter((c) => c.students.indexOf(req.user.id) !== -1);
    }
    res.json(list);
});

router.get("/:id/stream", auth(), (req, res) => {
    const posts = db.posts
        .filter((p) => p.classroomId === req.params.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(posts);
});

module.exports = router;