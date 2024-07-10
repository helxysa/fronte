import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contrato_itens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('contrato_id').unsigned().notNullable()
      table
        .foreign('contrato_id')
        .references('id')
        .inTable('contratos')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('titulo').notNullable()
      table.string('unidade_medida').notNullable()
      table.string('valor_unitario').notNullable()
      table.string('saldo_quantidade_contratada').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
