import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('user_contrato_pjs', (table) => {
      table.renameColumn('status', 'situacao')
    })
  }

  async down() {
    this.schema.alterTable('user_contrato_pjs', (table) => {
      table.renameColumn('situacao', 'status')
    })
  }
}
