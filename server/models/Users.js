import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/dbConnect.js";
import bcrypt from "bcrypt";

class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
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
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  serviceLookingFor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  userVerifyToken: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  userVerified: {
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
  modelName: "User",
  tableName: "users",
  timestamps: true
});

// ✅ Hashing password before storing
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

export default User;