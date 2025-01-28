import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('contrato_pjs', (table) => {
      table.dateTime('deleted_at').nullable()
    })

    this.schema.alterTable('contrato_pj_projetos', (table) => {
      table.dateTime('deleted_at').nullable()
    })
  }
}
