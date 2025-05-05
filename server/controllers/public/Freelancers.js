import express from "express";
import bcrypt from "bcrypt";
import config from "config";
import jwt from "jsonwebtoken";
import sendEmail from "../../utils/sendEmail.js";
// controllers/public/Freelancers.js
import db from "../../models/index.js";
const { Freelancer } = db;


const router = express.Router();
const URL = config.get("URL");
const KEY = config.get("JWT_KEY");

router.post("/freelancersignup", async (req, res) => {
  try {
    let { flname, flemail, password, expertiseIn, experience } = req.body;

    let freelancerExists = await freelancerModel.findOne({ where: { flemail } }); // Change: Use Freelancer model
    if (freelancerExists) {
      return res.status(200).json({ msg: "The email already exists🙌" });
    }

    let hashPass = await bcrypt.hash(password, 10);
    let emailToken = Math.random().toString(36).substring(2);

    let newFreelancer = {
      flname,
      flemail,
      password: hashPass,
      expertiseIn,
      experience,
      userVerifyToken: { email: emailToken },
    };

    await freelancerModel.create(newFreelancer); // Change: Use Freelancer model

    let emailData = {
      from: "Team WebXperts",
      to: flemail,
      subject: "Email Verification",
      html: `<a href="${URL}/api/public/emailverify/${emailToken}">Verify Email</a>
            <br>
            <p>If the link doesn't work, copy and paste this URL:</p>
            <p>${URL}/api/public/emailverify/${emailToken}</p>`,
    };

    sendEmail(emailData);

    console.log(`${URL}/api/public/emailverify/${emailToken}`);
    return res.status(201).json({ msg: "Signup successful! Check your email for verification." });
  } catch (error) {
    console.log(error);
    res.status(401).json({ msg: error });
  }
});

router.get("/emailverify/:token", async (req, res) => {
  try {
    let token = req.params.token;
    let freelancer = await freelancerModel.findOne({
      where: freelancerModel.sequelize.where(
        freelancerModel.sequelize.json("userVerifyToken.email"),
        token
      ),
    });

    if (!freelancer) {
      return res.status(200).json({ msg: "invalid token" });
    }

    if (freelancer.userVerified?.email === true) {
      return res.status(200).json({ msg: "email already verified!" });
    }

    freelancer.userVerified.email = true;
    freelancer.userVerifyToken.email = null;

    await freelancer.save();

    res.status(200).json({ msg: "email verified✅" });
  } catch (error) {
    console.log(error);
    res.status(401).json({ msg: error });
  }
});

router.post("/freelancersignin", async (req, res) => {
  try {
    let { flemail, password } = req.body;

    let checkFreelancer = await freelancerModel.findOne({ where: { flemail } });
    if (!checkFreelancer) {
      return res.status(200).json({ msg: "Invalid email" });
    }

    let checkPass = await bcrypt.compare(password, checkFreelancer.password);
    if (!checkPass) {
      return res.status(200).json({ msg: "Invalid password" });
    }

    let token = jwt.sign({ id: checkFreelancer.id }, KEY, { expiresIn: "90d" });
    let id = checkFreelancer.id;

    res.status(200).json({ msg: "Freelancer logged in successfully", token, flemail, id });
  } catch (error) {
    console.log(error);
    res.status(200).json({ msg: error });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    let { flemail } = req.body;

    let freelancer = await freelancerModel.findOne({ where: { flemail } });
    if (!freelancer) {
      return res.status(200).json({ msg: "Freelancer not found!" });
    }

    let newPassword = Math.random().toString(36).slice(-8);
    let hashedPass = await bcrypt.hash(newPassword, 10);

    freelancer.password = hashedPass;
    await freelancer.save();

    let emailData = {
      from: "Team WebXperts",
      to: flemail,
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