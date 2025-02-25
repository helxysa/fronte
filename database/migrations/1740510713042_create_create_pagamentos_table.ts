import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pagamentos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Referência ao relatório mensal
      table
        .integer('relatorio_mensal_id')
        .unsigned()
        .references('id')
        .inTable('relatorio_mensais')
        .onDelete('CASCADE')
        .notNullable()
      // Campos do pagamento
      table.date('periodo_prestacao').nullable()
      table.date('encaminhado_em').nullable()
      table.decimal('valor_pagamento', 10, 2).nullable()
      table
        .enum('status_pagamento', ['aguardando_pagamento', 'pago'])
        .defaultTo('aguardando_pagamento')
        .nullable()

      // Controle de data e exclusão lógica
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
