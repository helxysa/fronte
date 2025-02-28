import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pagamento_anexos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Referência ao pagamento
      table
        .integer('pagamento_id')
        .unsigned()
        .references('id')
        .inTable('pagamentos')
        .onDelete('CASCADE')
        .notNullable()

      // Informações do arquivo
      table.string('file_name').notNullable()
      table.string('file_path').notNullable()
      table.string('file_type').notNullable()

      // Campos de controle
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
