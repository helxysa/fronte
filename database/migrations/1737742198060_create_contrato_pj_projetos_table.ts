import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contrato_pj_projetos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('contrato_pj_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('contrato_pjs')
        .onDelete('CASCADE')

      table
        .integer('projeto_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projetos')
        .onDelete('CASCADE')

      table.string('servico_prestado').notNullable()
      table.string('esforco_estimado').notNullable()
      table.string('gestor_projeto').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
