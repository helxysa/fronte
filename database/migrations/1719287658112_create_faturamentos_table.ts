import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faturamentos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('contrato_id').unsigned().notNullable()
      table
        .foreign('contrato_id')
        .references('contratos.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('status').notNullable()
      // table.string('nota_fiscal')
      // table.string('data_pagamento')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
