import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contratos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('termo_aditivo_id')
        .unsigned()
        .references('id')
        .inTable('contratos')
        .nullable()
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('termo_aditivo_id')
    })
  }
}
