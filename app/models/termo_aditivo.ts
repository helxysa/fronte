import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Contratos from './contratos.js'
import TermoAditivoItem from './termo_aditivo_item.js'
import TermoAditivoAnexo from './termo_aditivo_anexo.js'

export default class TermoAditivo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

  @column()
  declare nome_termo: string

  @column.date()
  declare data_inicio: DateTime

  @column.date()
  declare data_fim: DateTime

  @column()
  declare saldo_contrato: number

  @column()
  declare objeto_contrato: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratos, { foreignKey: 'contrato_id' })
  declare contrato: BelongsTo<typeof Contratos>

  @hasMany(() => TermoAditivoItem, { foreignKey: 'termo_aditivo_id' })
  declare termoAditivoItem: HasMany<typeof TermoAditivoItem>

  @hasMany(() => TermoAditivoAnexo, { foreignKey: 'termo_aditivo_id' })
  declare termoAditivoAnexo: HasMany<typeof TermoAditivoAnexo>
}
