import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Adicionar status ao ContratoPJ
    this.schema.alterTable('contrato_pjs', (table) => {
      table.enum('status', ['ativo', 'inativo']).notNullable().defaultTo('ativo')
    })

    // Adicionar CNPJ ao User
    this.schema.alterTable('users', (table) => {
      table.string('cnpj', 16).nullable().unique()
      // Remover a coluna antiga de contrato_pj_id pois será substituída pela tabela intermediária
      table.dropColumn('contrato_pj_id')
    })

    // Criar tabela intermediária
    this.schema.createTable('user_contrato_pjs', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('contrato_pj_id')
        .unsigned()
        .references('id')
        .inTable('contrato_pjs')
        .onDelete('CASCADE')
      table.enum('status', ['ativo', 'inativo']).notNullable().defaultTo('ativo')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Garante que um usuário não tenha mais de um contrato ativo
      table.unique(['user_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable('user_contrato_pjs')

    this.schema.alterTable('users', (table) => {
      table.dropColumn('cnpj')
      table.integer('contrato_pj_id').unsigned().nullable()
    })

    this.schema.alterTable('contrato_pjs', (table) => {
      table.dropColumn('status')
    })
  }
}
