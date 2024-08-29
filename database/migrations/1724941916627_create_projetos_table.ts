import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projetos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('projeto').notNullable()
      table.unique(['projeto', 'contrato_id'])
      table
        .integer('contrato_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('contratos')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
