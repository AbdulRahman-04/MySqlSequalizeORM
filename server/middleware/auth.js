import jwt from "jsonwebtoken";
import config from "config";

let KEY = config.get("JWT_KEY");

const authMiddleware = (req, res, next) => {
  let authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  let token = authHeader.split(" ")[1];

  try {
    let decoded = jwt.verify(token, KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(403).json({ error: "Invalid Token" });
  }
};

export default authMiddleware;