import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import TermoAditivo from './termo_aditivo.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TermoAditivoItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare termo_aditivo_id: number

  @column()
  declare titulo: string

  @column()
  declare unidade_medida: string

  @column()
  declare valor_unitario: string

  @column()
  declare quantidade_contratada: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => TermoAditivo, { foreignKey: 'termo_aditivo_id' })
  declare termoAditivo: BelongsTo<typeof TermoAditivo>
}
