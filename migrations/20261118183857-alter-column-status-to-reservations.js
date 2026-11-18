"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add the new values to PostgreSQL's existing ENUM type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_reservations_status" ADD VALUE IF NOT EXISTS 'waiting';
      ALTER TYPE "enum_reservations_status" ADD VALUE IF NOT EXISTS 'held';
      ALTER TYPE "enum_reservations_status" ADD VALUE IF NOT EXISTS 'fulfilled';
      ALTER TYPE "enum_reservations_status" ADD VALUE IF NOT EXISTS 'expired';
    `);

    // 2. Now update the column's default value safely
    await queryInterface.sequelize.query(`
      ALTER TABLE "reservations" ALTER COLUMN "status" SET DEFAULT 'waiting';
    `);

    // 3. Add hold_expires_at column
    await queryInterface.addColumn("reservations", "hold_expires_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert default back to 'pending' and remove hold_expires_at
    await queryInterface.sequelize.query(`
      ALTER TABLE "reservations" ALTER COLUMN "status" SET DEFAULT 'pending';
    `);

    await queryInterface.removeColumn("reservations", "hold_expires_at");
  },
};