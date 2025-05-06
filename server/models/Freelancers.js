import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/dbConnect.js";

class Freelancer extends Model {}

Freelancer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    flname: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    flemail: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    expertise: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    experience: {
      type: DataTypes.STRING(50),  // Changed to string to store "2 years"
      allowNull: true,
    },
    userVerifyToken: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    userVerified: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { email: false, phone: false },
    },
  },
  {
    sequelize,
    modelName: "Freelancer",
    tableName: "freelancers",
    timestamps: true,
  }
);

export default Freelancer;
