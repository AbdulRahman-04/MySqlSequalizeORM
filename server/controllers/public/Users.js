import express from "express";
import bcrypt from "bcrypt";
import config from "config";
import jwt from "jsonwebtoken";
import sendEmail from "../../utils/sendEmail.js";
import db from "../../models/index.js";    // pure registry import karo
const { User } = db;                      // usme se User nikaalo

const router = express.Router();
const URL = config.get("URL");
const KEY = config.get("JWT_KEY");


// POST /usersignup - User Signup endpoint
router.post("/usersignup", async (req, res) => {
  try {
    const { username, email, password, age, phone, serviceLookingFor } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(200).json({ msg: "The email already exists 🙌" });
    }

    const hashPass = await bcrypt.hash(password, 10);
    const emailToken = Math.random().toString(36).substring(2);
    const phoneToken = Math.random().toString(36).substring(2);

    const newUser = {
      username,
      email,
      password: hashPass,
      age,
      phone,
      serviceLookingFor,
      userVerifyToken: {
        email: emailToken,
        phone: phoneToken,
      }
      // Assume that userVerified field is defined in the model with default value { email: false, phone: false }
    };

    await User.create(newUser);

    const emailData = {
      from: "Team WebXperts",
      to: email,
      subject: "Email Verification",
      html: `<a href="${URL}/api/public/emailverify/${emailToken}">Verify Email</a><br>
             <p>If the link doesn't work, copy and paste this URL:</p>
             <p>${URL}/api/public/emailverify/${emailToken}</p>`
    };

    await sendEmail(emailData);
    console.log("Email verification link:", `${URL}/api/public/emailverify/${emailToken}`);

    return res.status(201).json({ msg: "Signup successful! Please check your email for verification." });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ msg: error.toString() });
  }
});

// GET /emailverify/:token - Email verification endpoint
router.get("/emailverify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    console.log("Email verify endpoint hit with token:", token);

    // Using JSON_EXTRACT to query the JSON field for email verification token
    const user = await User.findOne({
      where: User.sequelize.where(
        User.sequelize.fn("JSON_EXTRACT", User.sequelize.col("userVerifyToken"), "$.email"),
        token
      )
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid token" });
    }

    if (user.userVerified && user.userVerified.email === true) {
      return res.status(200).json({ msg: "Email already verified!" });
    }

    // Set email verified and clear email token
    user.userVerified.email = true;
    user.userVerifyToken.email = null;
    await user.save();

    return res.status(200).json({ msg: "Email verified successfully ✅" });
  } catch (error) {
    console.error("Error in email verify endpoint:", error);
    return res.status(500).json({ msg: error.toString() });
  }
});



router.post("/usersignin", async (req, res) => {
  try {
    let { email, password } = req.body;

    let checkUser = await User.findOne({ where: { email } });
    if (!checkUser) {
      return res.status(200).json({ msg: "Invalid email" });
    }

    let checkPass = await bcrypt.compare(password, checkUser.password);
    if (!checkPass) {
      return res.status(200).json({ msg: "Invalid password" });
    }

    let token = jwt.sign({ id: checkUser.id }, KEY, { expiresIn: "90d" });
    let id = checkUser.id;

    res.status(200).json({ msg: "User logged in successfully", token, email, id });
  } catch (error) {
    console.log(error);
    res.status(200).json({ msg: error });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    let { email } = req.body;

    let user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ msg: "User not found!" });
    }

    let newPassword = Math.random().toString(36).slice(-8);
    let hashedPass = await bcrypt.hash(newPassword, 10);

    user.password = hashedPass;
    await user.save();

    let emailData = {
      from: "Team WebXperts",
      to: email,
      subject: "Password Reset",
      html: `<p>Your new password is: <b>${newPassword}</b></p>
             <p>Please change it after logging in.</p>`,
    };

    sendEmail(emailData);

    return res.status(200).json({ msg: "Password reset successful! Check your email for the new password." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong!" });
  }
});

export default router;