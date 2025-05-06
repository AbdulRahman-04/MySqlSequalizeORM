import express from "express";
import colors from "colors";
import morgan from "morgan";
import config from "config";
import cors from "cors";
import ratelimit from "express-rate-limit";
import "./utils/dbConnect.js"; // MySQL Sequelize connection
import "./models/index.js"

// Import private APIs
import userRouter from "./controllers/private/users.js";
import freelancerRouter from "./controllers/private/freelancers.js";

// Import public APIs
import userpublicRouter from "./controllers/public/Users.js";
import freelancerpublicRouter from "./controllers/public/Freelancers.js";

// Auth Middleware (JWT)
import authMiddleware from "./middleware/auth.js";

const app = express();
const PORT = config.get("PORT") || 8000;

// Logging middleware
app.use(morgan("dev"));

// Enable CORS for frontend access
app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));

app.use(express.json());

// Rate Limiting
let limiter = ratelimit({
  windowMs: 5 * 60 * 100, // 5 minutes
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests! Wait before sending again.",
  statusCode: 429,
});

app.get("/", (req, res) => {
  try {
    res.status(200).json({ msg: "Welcome to WebXperts Backend!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.red });
  }
});

app.get("/suhail", (req, res)=>{
  try {
    
    res.status(200).json({msg: "Hello"})

  } catch (error) {
    console.log(error);
    
  }
})

// Public APIs
app.use("/api/public", userpublicRouter);
app.use("/api/public", freelancerpublicRouter);

// Apply rate limiting
app.use(limiter);


// Private APIs
app.use("/api/users", authMiddleware, userRouter);
app.use("/api/freelancers", authMiddleware ,freelancerRouter);

app.listen(PORT, () => {
  console.log(`SUHAIL IS LIVE AT PORT ${PORT}`);
});