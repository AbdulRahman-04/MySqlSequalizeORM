import { Sequelize } from "sequelize";
import config from "config";

const dbConfig = config.get("DB");

console.log("🔧 Loaded DB Config:", dbConfig); // Debug log

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: "127.0.0.1", // Explicitly forcing TCP/IP
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: {
      connectTimeout: 10000, // Avoid connection timeout issues
    },
    logging: console.log, // Debugging SQL queries
  }
);

sequelize
  .authenticate()
  .then(() => console.log("✅ MySQL CONNECTED with config package"))
  .catch((error) => console.error("❌ Unable to connect to MySQL DB:", error));

export default sequelize;