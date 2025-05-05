import sequelize from "../utils/dbConnect.js";
import User from "./Users.js";           
import Freelancer from "./Freelancers.js"; 

const db = { sequelize, User, Freelancer };

// ✅ Ensuring models sync correctly
db.sequelize.sync({ force: false })
  .then(() => console.log("✅ All models were synchronized successfully."))
  .catch(err => console.error("❌ Model sync error:", err));

export default db;