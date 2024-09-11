import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cidades'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('cidade')
      table.string('estado')
      table.string('latitude')
      table.string('longitude')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
