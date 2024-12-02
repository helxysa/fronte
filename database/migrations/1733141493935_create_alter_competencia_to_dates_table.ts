import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('lancamentos', (table) => {
      table.date('competencia').alter()
    })
  }

  async down() {
    this.schema.alterTable('lancamentos', (table) => {
      table.string('competencia').alter()
    })
  }
}
