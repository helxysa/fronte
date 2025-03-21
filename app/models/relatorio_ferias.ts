import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Contratoclt from './contratoclt.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class RelatorioFerias extends BaseModel {
  static table = 'relatorio_ferias'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'contrato_id' })
  declare contratoId: number

  @column()
  declare nome: string

  @column()
  declare cargo: string

  @column()
  declare setor: string

  @column()
  declare periodoAquisitivoInicio: DateTime

  @column()
  declare periodoAquisitivoFim: DateTime

  @column()
  declare periodoGozoInicio: DateTime

  @column()
  declare periodoGozoFim: DateTime

  @column()
  declare dataRetorno: DateTime

  @column()
  declare abonoPecuniario: boolean

  @column()
  declare diasAbono: number | null

  @column()
  declare valorAbono: number | null

  @column()
  declare observacoes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratoclt, {
    localKey: 'id',
    foreignKey: 'contratoId',
  })
  declare contrato: BelongsTo<typeof Contratoclt>
}
