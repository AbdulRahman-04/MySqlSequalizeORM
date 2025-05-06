// routes/freelancer.js
import express from "express";
import bcrypt from "bcryptjs";
import config from "config";
import jwt from "jsonwebtoken";
import Sequelize from "sequelize";
import sendEmail from "../../utils/sendEmail.js";
import db from "../../models/index.js";

const { Freelancer, sequelize } = db;
const router = express.Router();
const URL = config.get("URL");
const KEY = config.get("JWT_KEY");

// Ensure schema is up-to-date
sequelize.sync({ alter: true }).catch(err => console.error("DB sync error:", err));

// --- Freelancer Signup ---
// routes/freelancer.js

router.post("/freelancersignup", async (req, res) => {
  try {
    const { flname, flemail, password, expertiseIn, experience } = req.body;

    // 1️⃣ Validate required fields
    if (!flname || !flemail || !password) {
      return res.status(400).json({ msg: "Name, email and password are required!" });
    }

    // 2️⃣ Check if email already exists (use flemail column)
    if (await Freelancer.findOne({ where: { flemail } })) {
      return res.status(400).json({ msg: "The email already exists 🙌" });
    }

    // 3️⃣ Hash password
    const hashPass  = await bcrypt.hash(password, 10);
    const emailToken = Math.random().toString(36).substring(2);

    // 4️⃣ Create freelancer using model field names
    await Freelancer.create({
      flname,              // matches model
      flemail,             // matches model
      password: hashPass,
      expertise: expertiseIn,
      experience,
      userVerifyToken: { email: emailToken },
      userVerified:    { email: false }
    });

    // 5️⃣ Send verification email
    await sendEmail({
      from:    "Team WebXperts",
      to:      flemail,
      subject: "Email Verification",
      html: `
        <a href="${URL}/api/public/freelancer/emailverify/${emailToken}">Verify Email</a><br>
        <p>If link doesn't work, copy-paste:</p>
        <p>${URL}/api/public/freelancer/emailverify/${emailToken}</p>
      `
    });

    console.log(`✅ Verification link: ${URL}/api/public/freelancer/emailverify/${emailToken}`);
    return res.status(201).json({ msg: "Signup successful! Check your email for verification." });

  } catch (error) {
    console.error("❌ Error in freelancer signup:", error);
    return res.status(500).json({ msg: "Database error, please try again!" });
  }
});


// --- Freelancer Email Verify ---
router.get("/freelancer/emailverify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    console.log("✅ Email verify endpoint hit with token:", token);

    const freelancer = await Freelancer.findOne({
      where: Sequelize.literal(`JSON_UNQUOTE(userVerifyToken->'$.email') = '${token}'`)
    });

    if (!freelancer) {
      return res.status(400).json({ msg: "Invalid token" });
    }
    if (freelancer.userVerified?.email) {
      return res.status(200).json({ msg: "Email already verified!" });
    }

    freelancer.userVerified.email = true;
    freelancer.userVerifyToken.email = null;
    await freelancer.save();

    console.log("✅ Email verification successful for:", freelancer.email);
    return res.status(200).json({ msg: "Email verified successfully ✅" });
  } catch (error) {
    console.error("❌ Error in email verification:", error);
    return res.status(500).json({ msg: "Internal server error, please try again!" });
  }
});

// --- Freelancer Signin ---
router.post("/freelancersignin", async (req, res) => {
  try {
    const { flemail, password } = req.body;
    if (!flemail || !password) {
      return res.status(400).json({ msg: "Email and password are required!" });
    }

    // Use flemail for lookup
    const freelancer = await Freelancer.findOne({ where: { flemail } });
    if (!freelancer) {
      return res.status(400).json({ msg: "Invalid email" });
    }

    const match = await bcrypt.compare(password, freelancer.password);
    if (!match) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign({ id: freelancer.id }, KEY, { expiresIn: "90d" });
    return res.status(200).json({
      msg:   "Freelancer logged in successfully",
      token,
      email: flemail,
      id:    freelancer.id
    });
  } catch (error) {
    console.error("❌ Error in freelancer signin:", error);
    return res.status(500).json({ msg: "Server error, try again!" });
  }
});

// --- Freelancer Reset Password ---
router.post("/freelancer/reset-password", async (req, res) => {
  try {
    const { flemail } = req.body;
    const freelancer = await Freelancer.findOne({ where: { email: flemail } });
    if (!freelancer) {
      return res.status(400).json({ msg: "Freelancer not found!" });
    }

    const newPassword = Math.random().toString(36).slice(-8);
    freelancer.password = await bcrypt.hash(newPassword, 10);
    await freelancer.save();

    await sendEmail({
      from: "Team WebXperts",
      to: flemail,
      subject: "Password Reset",
      html: `<p>Your new password is: <b>${newPassword}</b></p><p>Please change it after logging in.</p>`
    });

    return res.status(200).json({ msg: "Password reset successful! Check your email for the new password." });
  } catch (error) {
    console.error("❌ Error in reset password:", error);
    return res.status(500).json({ msg: "Something went wrong!" });
  }
});

export default router;