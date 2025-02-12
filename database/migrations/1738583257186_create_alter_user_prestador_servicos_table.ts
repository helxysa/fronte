import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('prestador_servicos').defaultTo(false)
      //contratoPjId
      table
        .integer('contrato_pj_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('contrato_pjs')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('prestador_servicos')
      table.dropColumn('contrato_pj_id')
    })
  }
}
