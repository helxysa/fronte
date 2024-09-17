import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('password_expired_at').nullable()
      table.string('password_reset_token', 255).nullable()
      table.boolean('password_changed').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('password_expired_at')
      table.dropColumn('password_reset_token')
      table.dropColumn('password_changed')
    })
  }
}
