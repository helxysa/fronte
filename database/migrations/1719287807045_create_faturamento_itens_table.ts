import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'faturamento_itens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('faturamento_id').unsigned().notNullable()
      table
        .foreign('faturamento_id')
        .references('faturamentos.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.integer('contrato_item_id').unsigned().notNullable()
      table
        .foreign('contrato_item_id')
        .references('contrato_itens.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('titulo').notNullable()
      table.string('unidade_medida').notNullable()
      table.string('valor_unitario').notNullable()
      table.string('quantidade_itens').notNullable()
      table.string('saldo_quantidade_contratada').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
