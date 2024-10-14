import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import TermoAditivo from './termo_aditivo.js'

export default class TermoAditivoAnexo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare termo_aditivo_id: number

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

  @belongsTo(() => TermoAditivo, { foreignKey: 'termo_aditivo_id' })
  declare termo_aditivo: BelongsTo<typeof TermoAditivo>
}
