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
      type: DataTypes.ENUM(
        "waiting",
        "held",
        "fulfilled",
        "cancelled",
        "expired",
      ),
      allowNull: false,
      defaultValue: "waiting",
    },
    hold_expires_at: {
      type:  DataTypes.DATE,
      allowNull: true,
    },
  },
  { tableName: "reservations", timestamps: true },
);

module.exports = Reservations;
