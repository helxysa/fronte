import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'relatorio_mensal_anexos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('relatorio_mensal_id')
        .unsigned()
        .references('id')
        .inTable('relatorio_mensais')
        .onDelete('CASCADE')

      table.string('file_name').notNullable()
      table.string('file_path').notNullable()
      table.string('file_type').notNullable()
      table.enum('tipo_anexo', ['relatorio_assinado', 'nota_fiscal']).notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
