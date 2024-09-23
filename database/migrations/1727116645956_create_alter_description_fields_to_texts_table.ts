import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('contratos', (table) => {
      table.text('observacoes').alter()
    })
    this.schema.alterTable('faturamentos', (table) => {
      table.text('observacoes').alter()
    })
    this.schema.alterTable('lancamentos', (table) => {
      table.text('descricao').alter()
    })
  }

  async down() {
    this.schema.alterTable('contratos', (table) => {
      table.string('observacoes', 255).alter()
    })
    this.schema.alterTable('faturamentos', (table) => {
      table.string('observacoes', 255).alter()
    })
    this.schema.alterTable('lancamentos', (table) => {
      table.string('descricao', 255).alter()
    })
  }
}
