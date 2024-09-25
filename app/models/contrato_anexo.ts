import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Contratos from '#models/contratos'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ContratoAnexo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

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

  @belongsTo(() => Contratos, { foreignKey: 'contrato_id' })
  declare contrato: BelongsTo<typeof Contratos>
}
