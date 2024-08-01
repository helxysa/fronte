import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contratos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('nome_contrato')
      table.string('lembrete_vencimento')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('nome_contrato')
      table.dropColumn('lembrete_vencimento')
    })
  }
}
