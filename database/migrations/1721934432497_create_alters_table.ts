import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lancamentos'

  async up() {
    this.schema.alterTable('lancamentos', (table) => {
      table.integer('faturamento_id').unsigned().references('id').inTable('faturamentos')
    })
  }

  async down() {
    this.schema.alterTable('lancamentos', (table) => {
      table.dropColumn('faturamento_id')
    })
  }
}
