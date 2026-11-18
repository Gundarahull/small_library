const { Sequelize } = require("sequelize");
require("dotenv").config();

const connectDB = new Sequelize(
  process.env.DB_NAME,
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
