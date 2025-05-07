import express from "express";
import bcrypt from "bcrypt";
import config from "config";
import jwt from "jsonwebtoken";
import sendEmail from "../../utils/sendEmail.js";
import db from "../../models/index.js";

const { Freelancer } = db; // ✅ Fix: Using correct model reference

const router = express.Router();
const URL = config.get("URL");
const KEY = config.get("JWT_KEY");

router.post("/freelancersignup", async (req, res) => {
  try {
    const { flname, flemail, password, expertiseIn, experience } = req.body;

    const freelancerExists = await Freelancer.findOne({ where: { email: flemail } }); // ✅ Fix: Using Freelancer model
    if (freelancerExists) {
      return res.status(400).json({ msg: "The email already exists 🙌" });
    }

    const hashPass = await bcrypt.hash(password, 10);
    const emailToken = Math.random().toString(36).substring(2);

    const newFreelancer = await Freelancer.create({
      name: flname, // ✅ Fix: Matching model field name
      email: flemail, // ✅ Fix: Correcting field name
      password: hashPass,
      expertise: expertiseIn, // ✅ Fix: Matching model field name
      experience,
      userVerifyToken: { email: emailToken },
    });

    const emailData = {
      from: "Team WebXperts",
      to: flemail,
      subject: "Email Verification",
      html: `<a href="${URL}/api/public/emailverify/${emailToken}">Verify Email</a><br>
             <p>If the link doesn't work, copy and paste this URL:</p>
             <p>${URL}/api/public/emailverify/${emailToken}</p>`,
    };

    await sendEmail(emailData);
    console.log(`✅ Email verification link: ${URL}/api/public/emailverify/${emailToken}`);

    return res.status(201).json({ msg: "Signup successful! Check your email for verification." });
  } catch (error) {
    console.error("❌ Error in freelancer signup:", error);
    return res.status(500).json({ msg: "Database error, please try again!" });
  }
});

// ✅ Fix: Correct JSON field query
router.get("/emailverify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    console.log("✅ Email verify endpoint hit with token:", token);

    const freelancer = await Freelancer.findOne({
      where: Sequelize.literal(`JSON_UNQUOTE(userVerifyToken->'$.email') = '${token}'`)
    });

    if (!freelancer) return res.status(400).json({ msg: "Invalid token" });
    if (freelancer.userVerified?.email === true) return res.status(200).json({ msg: "Email already verified!" });

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

router.post("/freelancersignin", async (req, res) => {
  try {
    const { flemail, password } = req.body;

    const checkFreelancer = await Freelancer.findOne({ where: { email: flemail } }); // ✅ Fix: Using correct model
    if (!checkFreelancer) return res.status(400).json({ msg: "Invalid email" });

    const checkPass = await bcrypt.compare(password, checkFreelancer.password);
    if (!checkPass) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: checkFreelancer.id }, KEY, { expiresIn: "90d" });

    return res.status(200).json({ msg: "Freelancer logged in successfully", token, flemail, id: checkFreelancer.id });
  } catch (error) {
    console.error("❌ Error in freelancer signin:", error);
    return res.status(500).json({ msg: "Server error, try again!" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { flemail } = req.body;

    const freelancer = await Freelancer.findOne({ where: { email: flemail } }); // ✅ Fix: Using correct model
    if (!freelancer) return res.status(400).json({ msg: "Freelancer not found!" });

    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPass = await bcrypt.hash(newPassword, 10);

    freelancer.password = hashedPass;
    await freelancer.save();

    const emailData = {
      from: "Team WebXperts",
      to: flemail,
      subject: "Password Reset",
      html: `<p>Your new password is: <b>${newPassword}</b></p>
             <p>Please change it after logging in.</p>`,
    };

    await sendEmail(emailData);
    return res.status(200).json({ msg: "Password reset successful! Check your email for the new password." });
  } catch (error) {
    console.error("❌ Error in reset password:", error);
    return res.status(500).json({ msg: "Something went wrong!" });
  }
});

export default router;