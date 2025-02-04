import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ContratoPJ from './contrato_pj.js'

export default class ContratoPjAnexo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_pj_id: number

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

  @belongsTo(() => ContratoPJ, { foreignKey: 'contrato_pj_id' })
  declare contrato_pj: BelongsTo<typeof ContratoPJ>
}
