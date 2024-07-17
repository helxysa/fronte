/* eslint-disable prettier/prettier */
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contratos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('vigencia')
      table.date('data_inicio')
      table.date('data_fim')
      table.string('observacoes').nullable()
    })
  }

  async down() {}
}
