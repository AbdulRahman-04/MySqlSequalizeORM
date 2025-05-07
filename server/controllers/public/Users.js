import express from "express";
import bcrypt from "bcryptjs";                // 🔄 Switched to bcryptjs for reliability
import config from "config";
import jwt from "jsonwebtoken";
import sendEmail from "../../utils/sendEmail.js";
import db from "../../models/index.js";

const { User, sequelize } = db;
const router = express.Router();
const URL = config.get("URL");
const KEY = config.get("JWT_KEY");

// Ensure DB and tables exist
async function initializeDatabase() {
  await sequelize.sync({ alter: true });
}

// User Signup API
router.post("/usersignup", async (req, res) => {
  try {
    const { username, email, password, age, phone } = req.body;

    // 🔍 Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) return res.status(200).json({ msg: "User already exists! Please login." });

    // 🔒 Hash password
    const hashPass = await bcrypt.hash(password, 10);

    // 🔄 Generate verification tokens
    const emailToken = Math.random().toString(36).substring(2);
    const phoneToken = Math.random().toString(36).substring(2);

    // 🗃 Create user without JSON.stringify()
    const newUser = await User.create({
      username,
      email,
      password: hashPass,
      phone,
      age,
      userVerifyToken: { email: emailToken, phone: phoneToken }, 
      userVerified: { email: false, phone: false } 
    });

    // 📩 Send verification email
    const emailData = {
      from: "Team WebXperts",
      to: email,
      subject: "Email Verification",
      html: `<a href="${URL}/api/public/emailverify/${emailToken}">Verify Email</a>`,
    };

    await sendEmail(emailData);

    res.status(200).json({ msg: "Signup successful! Verify your email via the link sent. ✅" });
  } catch (error) {
    console.error("❌ Error in signup:", error);
    res.status(500).json({ msg: "Database error, please try again!" });
  }
});

// Email Verify API
router.get("/emailverify/:token", async (req, res) => {
  try {
    const token = req.params.token;

    // 🔍 Find user with the matching email token
    const user = await User.findOne({
      where: { userVerifyToken: { email: token } }
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid token ❌" });
    }

    if (user.userVerified.email) {
      return res.status(200).json({ msg: "Email already verified 🙌" });
    }

    // 🔄 Update verification status & remove token
    user.userVerified.email = true;
    user.userVerifyToken.email = null;

    await user.save();

    return res.status(200).json({ msg: "Email verified successfully! ✅" });
  } catch (error) {
    console.error("❌ Error in email verification:", error);
    return res.status(500).json({ msg: "Internal server error, please try again!" });
  }
});

// User Signin API
router.post("/usersignin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 Find user by email in MySQL
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ msg: "Email not found ❌" });

    // 🔍 Log password details for debugging
    console.log("🔍 Input Password:", password);
    console.log("🔍 Stored Hashed Password:", user.password);

    // 🔒 Check password properly
    const checkPass = await bcrypt.compare(password.trim(), user.password?.trim() ?? "");
    console.log("🔍 Password Match:", checkPass);

    if (!checkPass) return res.status(401).json({ msg: "Invalid password ❌" });

    // 🔥 Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_KEY, { expiresIn: "2d" });

    res.status(200).json({ msg: "User logged in successfully! ✅", token });
  } catch (error) {
    console.error("❌ Error in signin:", error);
    res.status(500).json({ msg: "Internal server error, please try again!" });
  }
});

// Reset Password API
router.post("/reset-password", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    if (!email) {
      return res.status(400).json({ msg: "Email is required!" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ msg: "User not found!" });

    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPass = await bcrypt.hash(newPassword, 10);

    user.password = hashedPass;
    await user.save();

    const emailData = {
      from: "Team WebXperts",
      to: email,
      subject: "Password Reset",
      html: `<p>Your new password is: <b>${newPassword}</b></p>`,
    };

    await sendEmail(emailData);
    return res.status(200).json({ msg: "Password reset successful! Check your email for the new password." });
  } catch (error) {
    console.error("❌ Error in reset password:", error);
    return res.status(500).json({ msg: "Something went wrong!" });
  }
});

export default router;