import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faturamentos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('projetos').nullable()
      table.date('data_pagamento').nullable()
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('projetos')
      table.dropColumn('data_pagamento')
    })
  }
}
