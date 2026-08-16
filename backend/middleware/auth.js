const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function auth(roles) {
    roles = roles || [];
    return function (req, res, next) {
        const header = req.headers["authorization"];
        if (!header) return res.status(401).json({ error: "No token provided" });
        const token = header.split(" ")[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (roles.length && roles.indexOf(decoded.role) === -1) {
                return res.status(403).json({ error: "Forbidden" });
            }
            req.user = decoded;
            next();
        } catch (e) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
    };
}

module.exports = { auth, JWT_SECRET };