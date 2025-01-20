import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lancamento_itens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('convertido').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('convertido')
    })
  }
}
