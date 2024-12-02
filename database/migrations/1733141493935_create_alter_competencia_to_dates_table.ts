import { BaseSchema } from '@adonisjs/lucid/schema'
import Database from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  async up() {
    await Database.from('lancamentos')
      .whereRaw(`competencia !~ '^\d{4}-\d{2}-\d{2}$'`)
      .update({ competencia: null })

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
