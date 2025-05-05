import express from "express";
import User from "../../models/Users.js";


const router = express.Router();

router.get("/getallusers", async (req, res) => {
  try {
    let getAll = await userModel.findAll(); // change: Sequelize uses findAll() instead of find({})
    res.status(200).json({ msg: getAll });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.get("/getoneuser/:id", async (req, res) => {
  try {
    let paramsId = req.params.id;
    let getOne = await userModel.findByPk(paramsId); // change: Using findByPk() for direct primary key lookup
    if (!getOne) return res.status(404).json({ msg: "User not found!" });

    res.status(200).json({ msg: getOne });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.put("/editoneuser/:id", async (req, res) => {
  try {
    let paramsId = req.params.id;
    let userInp = req.body;

    let updatedUser = await userModel.update(userInp, { where: { id: paramsId } }); // change: Sequelize update() method

    if (updatedUser[0] === 0) return res.status(404).json({ msg: "User not found!" });

    res.status(200).json({ msg: "User updated successfully!" });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.delete("/deleteoneuser/:id", async (req, res) => {
  try {
    let paramsId = req.params.id;
    let deletedUser = await userModel.destroy({ where: { id: paramsId } }); // change: Sequelize destroy() method

    if (deletedUser === 0) return res.status(404).json({ msg: "User not found!" });

    res.status(200).json({ msg: "User deleted successfully! ✅" });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.delete("/deleteall", async (req, res) => {
  try {
    await userModel.destroy({ where: {} }); // change: Using Sequelize destroy() instead of deleteMany({})
    res.status(200).json({ msg: "All users deleted ✅" });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

export default router;