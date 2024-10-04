import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('nome')
      table.string('cargo')
      table.string('setor')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('nome')
      table.dropColumn('cargo')
      table.dropColumn('setor')
    })
  }
}
