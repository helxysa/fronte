import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faturamentos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('renovacao_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('renovacaos')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('renovacao_id')
    })
  }
}
