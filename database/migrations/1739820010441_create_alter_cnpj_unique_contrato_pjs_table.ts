import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contrato_pjs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['cnpj'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['cnpj'])
    })
  }
}
