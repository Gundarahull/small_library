// models/member.js
const { DataTypes } = require("sequelize");
const connectDB = require("../config/db");

const Member = connectDB.define(
  "members",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("member", "librarian"),
      defaultValue: "member",
      allowNull: false,
    },
  },
  {
    tableName: "members",
    timestamps: true,
  },
);

module.exports = Member;
