import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Faturamentos from '#models/faturamentos'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class FaturamentoAnexo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare faturamento_id: number

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

  @belongsTo(() => Faturamentos, { foreignKey: 'faturamento_id' })
  declare faturamentos: BelongsTo<typeof Faturamentos>
}
