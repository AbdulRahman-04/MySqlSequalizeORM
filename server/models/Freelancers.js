import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/dbConnect.js";
import bcrypt from "bcrypt";

class Freelancer extends Model {}

Freelancer.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  expertise: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  verified: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: { email: false, phone: false }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
  }
}, {
  sequelize,
  modelName: "Freelancer",
  tableName: "freelancers",
  timestamps: true
});

// ✅ Hashing password before storing
Freelancer.beforeCreate(async (freelancer) => {
  freelancer.password = await bcrypt.hash(freelancer.password, 10);
});

export default Freelancer;