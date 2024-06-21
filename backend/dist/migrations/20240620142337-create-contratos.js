"use strict";'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("contratos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nome_cliente: {
        type: Sequelize.STRING,
      },
      vigencia: {
        type: Sequelize.DATE,
      },
      saldo_contrato: {
        type: Sequelize.STRING,
      },
      fiscal: {
        type: Sequelize.STRING,
      },
      ponto_focal: {
        type: Sequelize.STRING,
      },
      cidade: {
        type: Sequelize.STRING,
      },
      objeto_contrato: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contratos');
  }
};
