import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faturamentos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('nota_fiscal').nullable()
      table.date('data_pagamento').nullable()
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('nota_fiscal')
      table.dropColumn('data_pagamento')
    })
  }
}
