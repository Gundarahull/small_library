// models/book.js
const { DataTypes } = require('sequelize');
const connectDB = require("../config/db");

const Book = connectDB.define('books', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isbn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  total_copies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  available_copies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'English',
  },
}, {
  tableName: 'books',
  timestamps: true,
});

module.exports = Book;