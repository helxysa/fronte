import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'relatorios_mensal_projetos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('relatorio_mensal_id')
        .unsigned()
        .references('id')
        .inTable('relatorio_mensais')
        .onDelete('CASCADE')
      table
        .integer('projeto_id')
        .unsigned()
        .references('id')
        .inTable('projetos')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
