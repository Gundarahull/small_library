"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.createTable("books", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isbn: { //Indian Standard Book Number
        type: Sequelize.INTEGER,
        unique:true,
        allowNull: false,
      },
      total_copies: { 
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue:1
      },
      avaiable_copies: { 
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue:1
      },
      createdAt: { type: Sequelize.DATE, allowNull: false , defaultValue: Sequelize.NOW},
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
    */
    await queryInterface.dropTable('books');
  },
};
