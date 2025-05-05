import { Sequelize } from "sequelize";
import config from "config"

// Access DB settings from the JSON file
const dbConfig = config.DB;

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect
    }
);

// Authenticate MySQL connection
sequelize.authenticate()
    .then(() => {
        console.log("✅ MySQL DB CONNECTED SUCCESSFULLY!");
    })
    .catch((error) => {
        console.error("❌ Unable to connect to MySQL DB:", error.message);
    });

export default sequelize;