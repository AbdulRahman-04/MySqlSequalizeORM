// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import config from "config";
import jwt from "jsonwebtoken";
import sendEmail from "../../utils/sendEmail.js";
import db from "../../models/index.js";

const { User, sequelize } = db;
const router = express.Router();
const URL = config.get("URL");
const KEY = config.get("JWT_KEY");

// Sync database (optional, but ensures model changes are applied)
sequelize.sync({ alter: true }).catch(err => console.error("DB sync error:", err));

// --- User Signup API ---
router.post("/usersignup", async (req, res) => {
  try {
    const { username, email, password, age, phone } = req.body;

    // Check existing user
    if (await User.findOne({ where: { email } })) {
      return res.status(200).json({ msg: "User already exists! Please login." });
    }

    // Hash password once here
    const hashPass = await bcrypt.hash(password, 10);

    // Generate verification tokens
    const emailToken = Math.random().toString(36).substring(2);
    const phoneToken = Math.random().toString(36).substring(2);

    // Create user
    await User.create({
      username,
      email,
      password: hashPass,
      age,
      phone,
      userVerifyToken: { email: emailToken, phone: phoneToken },
      userVerified: { email: false, phone: false }
    });

    // Send verification email
    await sendEmail({
      from: "Team WebXperts",
      to: email,
      subject: "Email Verification",
      html: `<a href="${URL}/api/public/emailverify/${emailToken}">Verify Email</a>`
    });

    res.status(200).json({ msg: "Signup successful! Verify your email via the link sent. ✅" });
  } catch (error) {
    console.error("❌ Error in signup:", error);
    res.status(500).json({ msg: "Database error, please try again!" });
  }
});

// --- Email Verification API ---
router.get("/emailverify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ where: { userVerifyToken: { email: token } } });

    if (!user) {
      return res.status(400).json({ msg: "Invalid token ❌" });
    }
    if (user.userVerified.email) {
      return res.status(200).json({ msg: "Email already verified 🙌" });
    }

    user.userVerified.email = true;
    user.userVerifyToken.email = null;
    await user.save();

    res.status(200).json({ msg: "Email verified successfully! ✅" });
  } catch (error) {
    console.error("❌ Error in email verification:", error);
    res.status(500).json({ msg: "Internal server error, please try again!" });
  }
});

// --- User Signin API ---
router.post("/usersignin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: "Email not found ❌" });
    }

    // Compare plaintext password with stored hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ msg: "Invalid password ❌" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, KEY, { expiresIn: "2d" });
    res.status(200).json({ msg: "User logged in successfully! ✅", token });
  } catch (error) {
    console.error("❌ Error in signin:", error);
    res.status(500).json({ msg: "Internal server error, please try again!" });
  }
});

// --- Reset Password API ---
router.post("/reset-password", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    if (!email) {
      return res.status(400).json({ msg: "Email is required!" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: "User not found!" });
    }

    // Generate new password and hash
    const newPassword = Math.random().toString(36).slice(-8);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Send reset email
    await sendEmail({
      from: "Team WebXperts",
      to: email,
      subject: "Password Reset",
      html: `<p>Your new password is: <b>${newPassword}</b></p>`
    });

    res.status(200).json({ msg: "Password reset successful! Check your email for the new password." });
  } catch (error) {
    console.error("❌ Error in reset password:", error);
    res.status(500).json({ msg: "Something went wrong!" });
  }
});

export default router;
