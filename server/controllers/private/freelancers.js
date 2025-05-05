import express from "express";
import Freelancer from "../../models/Freelancers.js";


const router = express.Router();

router.get("/getallfreelancers", async (req, res) => {
  try {
    let getAll = await freelancerModel.findAll(); // change: Sequelize findAll() instead of find({})
    res.status(200).json({ msg: getAll });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.get("/getonefreelancer/:id", async (req, res) => {
  try {
    let paramsId = req.params.id;
    let getOne = await freelancerModel.findByPk(paramsId); // change: Using findByPk() for direct primary key lookup
    if (!getOne) return res.status(404).json({ msg: "Freelancer not found!" });

    res.status(200).json({ msg: getOne });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.put("/editonefreelancer/:id", async (req, res) => {
  try {
    let paramsId = req.params.id;
    let freelancerInp = req.body;

    let updatedFreelancer = await freelancerModel.update(freelancerInp, { where: { id: paramsId } }); // change: Sequelize update() method

    if (updatedFreelancer[0] === 0) return res.status(404).json({ msg: "Freelancer not found!" });

    res.status(200).json({ msg: "Freelancer updated successfully!" });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.delete("/deleteonefreelancer/:id", async (req, res) => {
  try {
    let paramsId = req.params.id;
    let deletedFreelancer = await freelancerModel.destroy({ where: { id: paramsId } }); // change: Sequelize destroy() method

    if (deletedFreelancer === 0) return res.status(404).json({ msg: "Freelancer not found!" });

    res.status(200).json({ msg: "Freelancer deleted successfully! ✅" });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

router.delete("/deleteallfreelancers", async (req, res) => {
  try {
    await freelancerModel.destroy({ where: {} }); // change: Using Sequelize destroy() instead of deleteMany({})
    res.status(200).json({ msg: "All freelancers deleted ✅" });
  } catch (error) {
    res.status(401).json({ msg: error });
  }
});

export default router;