import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lancamentos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('dias').unsigned().nullable().after('tipo_medicao')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('dias')
    })
  }
}
