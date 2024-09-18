import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lancamentos'

  async up() {
    this.schema.alterTable('lancamentos', (table) => {
      table.string('competencia').nullable()
      table.string('descricao').nullable()
    })
  }

  async down() {
    this.schema.alterTable('lancamentos', (table) => {
      table.dropColumn('competencia')
      table.dropColumn('descricao')
    })
  }
}
