import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Cidade extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare cidade: string

  @column()
  declare estado: string

  @column()
  declare latitude: string | null

  @column()
  declare longitude: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
