import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contratos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('foto').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('foto')
    })
  }
}
