import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'relatorio_mensais'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('contrato_pj_id')
        .unsigned()
        .references('id')
        .inTable('contrato_pjs')
        .onDelete('CASCADE')

      table.date('periodo_prestacao').nullable()
      table.enum('tipo_execucao', ['demanda', 'mensal']).nullable()
      table.integer('horas_executadas').nullable()
      table.text('descricao_tarefas').nullable()
      table.string('relatorio_assinado').nullable()
      table.string('nota_fiscal').nullable()
      table.enum('status', ['pendente', 'disponivel_pagamento']).defaultTo('pendente')

      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
