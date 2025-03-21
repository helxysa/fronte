import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'relatorio_ferias'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('contrato_id')
        .unsigned()
        .references('id')
        .inTable('contrato_clts')
        .onDelete('CASCADE')
      // Campos preenchidos pelo sistema
      table.string('nome').notNullable()
      table.string('cargo').notNullable()
      table.string('setor').notNullable()
      // Períodos
      table.date('periodo_aquisitivo_inicio').notNullable()
      table.date('periodo_aquisitivo_fim').notNullable()
      table.date('periodo_gozo_inicio').notNullable()
      table.date('periodo_gozo_fim').notNullable()
      table.date('data_retorno').notNullable()
      // Abono Pecuniário
      table.boolean('abono_pecuniario').defaultTo(false)
      table.integer('dias_abono').nullable()
      table.decimal('valor_abono', 10, 2).nullable()
      table.text('observacoes').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
