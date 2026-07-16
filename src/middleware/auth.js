const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Splits "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is not configured in environment variables."));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    // Expose only the minimal identity fields needed (id) to avoid trusting stale/broad JWT claims
    req.user = { id: decoded.id };
    next();
  });
};

// Exporting the function directly so it is easily imported
module.exports = authenticateToken;
