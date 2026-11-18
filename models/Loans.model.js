const { DataTypes } = require("sequelize");
const connectDB = require("../config/db");

const Loans = connectDB.define(
  "loans",
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
    borrowed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    due_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    returned_at: { type: DataTypes.DATE },
  },
  { tableName: "loans", timestamps: true },
);

module.exports = Loans;
