import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faturamentos'

  async up() {
    this.schema.alterTable('faturamentos', (table) => {
      table.string('competencia').nullable()
    })
  }

  async down() {
    this.schema.alterTable('faturamentos', (table) => {
      table.dropColumn('competencia')
    })
  }
}
