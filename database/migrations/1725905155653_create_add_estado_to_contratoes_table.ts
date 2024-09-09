import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contratos'

  async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('estado')
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('estado')
    })
  }
}
