import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contrato_clts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('matricula').notNullable().unique()
      table.string('nome_completo').notNullable()
      table.string('cpf', 11).notNullable().unique()
      table.string('rg').notNullable()
      table.string('pis').notNullable()
      table.date('data_nascimento').notNullable()
      table.string('endereco_completo').notNullable()
      table.string('telefone').notNullable()
      table.string('email_pessoal').notNullable()
      table.date('data_admissao').notNullable()
      table.string('cargo').notNullable()
      table.string('nivel_profissional').notNullable()
      table.string('departamento').notNullable()
      table.string('projeto_atual').nullable()
      table.string('gestor_projeto').nullable()
      table.string('regime_trabalho').notNullable()
      table.string('horario_trabalho').notNullable()
      table.integer('jornada_semanal').notNullable()
      table.decimal('remuneracao', 15, 2).notNullable()
      table.string('forma_pagamento').notNullable()
      table.string('chave_pix').nullable()
      table.string('banco').nullable()
      table.string('agencia').nullable()
      table.string('numero_conta').nullable()
      table.boolean('plano_saude')
      table.string('empresa_plano_saude')
      table.boolean('vale_transporte')
      table.decimal('valor_vale_transporte', 10, 2)
      table.boolean('vale_alimentacao')
      table.decimal('valor_vale_alimentacao', 10, 2)
      table.string('outros_beneficios').nullable()
      table.string('observacao').nullable()
      table.string('documentos').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
