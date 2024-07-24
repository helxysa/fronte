import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lancamento_itens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('faturamento_id', 'lancamento_id')

      table
        .foreign('lancamento_id')
        .references('lancamentos.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('lancamento_id', 'faturamento_id')
      table
        .foreign('faturamento_id')
        .references('faturamentos.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }
}
