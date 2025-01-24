import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contrato_pjs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('razao_social').notNullable()
      table.string('nome_fantasia').notNullable()
      table.string('cnpj', 16).notNullable().unique()
      table.string('endereco_completo').notNullable()
      table.string('cidade').notNullable()
      table.string('estado').notNullable()
      table.string('telefone_empresa').notNullable()
      table.string('email_empresa').notNullable()
      table.string('representante_legal').notNullable()
      table.string('telefone_representante').notNullable()
      table.string('email_representante').notNullable()
      table
        .enum('tipo_contrato', ['tempo_determinado', 'tempo_indeterminado', 'projeto_especifico'])
        .notNullable()
      table.date('data_inicio').notNullable()
      table.date('data_fim').nullable()
      table.decimal('valor_mensal', 15, 2).nullable()
      table.decimal('valor_hora', 15, 2).nullable()
      table.enum('forma_pagamento', ['pix', 'transferencia_bancaria']).notNullable()
      table.string('chave_pix').nullable()
      table.string('banco').nullable()
      table.string('agencia').nullable()
      table.string('numero_conta').nullable()
      table.enum('tipo_conta', ['corrente', 'poupanca']).nullable()
      table.string('nome_titular').nullable()
      table
        .enum('servico_prestado', [
          'analista_ui_ux',
          'analista_qualidade',
          'desenvolvedor',
          'analista',
          'gestor_projeto',
          'devops',
          'devsecops',
        ])
        .notNullable()
      table.text('escopo_trabalho').notNullable()
      table.text('observacao').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
