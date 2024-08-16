import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lancamentos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('data_pagamento', 'data_medicao')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('data_medicao', 'data_pagamento')
    })
  }
}
