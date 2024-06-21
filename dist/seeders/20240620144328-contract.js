"use strict";'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("contratos", [
      {
        nome_cliente: "Empresa A",
        vigencia: new Date(),
        saldo_contrato: "100000",
        fiscal: "João da Silva",
        ponto_focal: "Maria Souza",
        cidade: "São Paulo",
        objeto_contrato: "Serviços de Consultoria",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('contratos', null, {});
  }
};
