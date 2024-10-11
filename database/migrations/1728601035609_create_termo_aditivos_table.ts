import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'termo_aditivos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('contrato_id')
        .unsigned()
        .references('id')
        .inTable('contratos')
        .onDelete('CASCADE')
      table.string('nome_termo')
      table.date('data_inicio')
      table.date('data_fim')
      table.string('saldo_contrato')
      table.string('objeto_contrato')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
