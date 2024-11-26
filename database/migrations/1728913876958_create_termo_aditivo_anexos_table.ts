import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'termo_aditivo_anexos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('termo_aditivo_id')
        .unsigned()
        .references('id')
        .inTable('termo_aditivos')
        .onDelete('CASCADE')
      table.string('file_name')
      table.string('file_path')
      table.string('file_type')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
