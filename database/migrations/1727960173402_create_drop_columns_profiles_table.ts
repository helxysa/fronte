import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profiles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('can_create')
      table.dropColumn('can_edit')
      table.dropColumn('can_view')
      table.dropColumn('can_delete')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('can_create').defaultTo(false)
      table.boolean('can_edit').defaultTo(false)
      table.boolean('can_view').defaultTo(false)
      table.boolean('can_delete').defaultTo(false)
    })
  }
}
