import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'termo_aditivo_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('termo_aditivo_id')
        .unsigned()
        .references('id')
        .inTable('termo_aditivos')
        .onDelete('CASCADE')
      table.string('titulo')
      table.string('unidade_medida')
      table.string('valor_unitario')
      table.integer('quantidade_contratada')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
