'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("contrato_itens", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      contrato_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "contratos",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      titulo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      unidade_medida: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      valor_unitario: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      saldo_quantidade_contratada: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.dropTable('contrato_itens');
  }
};
