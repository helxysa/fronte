import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faturamentos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('data_faturamento').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dateTime('data_faturamento').alter()
    })
  }
}
