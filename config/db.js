const { Sequelize } = require("sequelize");
require("dotenv").config();

const isTestEnvironment = process.env.NODE_ENV === "test";
if (isTestEnvironment) {
  require("dotenv").config({ path: ".env.test", override: true });
}

const databaseName = isTestEnvironment
  ? process.env.DB_TEST_NAME
  : process.env.DB_NAME;

if (!databaseName) {
  throw new Error(
    isTestEnvironment
      ? "DB_TEST_NAME must be set in .env.test before running tests."
      : "DB_NAME must be set in .env.",
  );
}

const connectDB = new Sequelize(
  databaseName,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10, //max 10 connections
      min: 0,
      idle: 10000, //only for idle for 10 secs
    },
  },
);

module.exports = connectDB;
