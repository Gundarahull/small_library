const { DataTypes } = require("sequelize");
const connectDB = require("../config/db");

const Reservations = connectDB.define(
  "reservations",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          name: "members",
        },
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          name: "books",
        },
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    status: {
      type: DataTypes.ENUM("pending", "returned", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  { tableName: "reservations", timestamps: true },
);

module.exports = Reservations;
