import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lancamentos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tarefa_medicao')
      table.string('tipo_medicao')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tarefa_medicao')
      table.dropColumn('tipo_medicao')
    })
  }
}
