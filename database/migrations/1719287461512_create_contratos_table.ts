import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contratos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('nome_cliente')
      table.date('vigencia')
      table.string('saldo_contrato')
      table.string('fiscal')
      table.string('ponto_focal')
      table.string('cidade')
      table.string('objeto_contrato')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
