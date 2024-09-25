import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Lancamentos from '#models/lancamentos'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class MedicaoAnexo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare lancamento_id: number

  @column()
  declare file_name: string

  @column()
  declare file_path: string

  @column()
  declare file_type: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Lancamentos, { foreignKey: 'lancamento_id' })
  declare lancamentos: BelongsTo<typeof Lancamentos>
}
