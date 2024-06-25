import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Faturamentos from './faturamentos.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ContratoItens from './contrato_itens.js'

export default class FaturamentoItens extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare faturamentoId: number

  @column()
  declare contratoItemId: number

  @column()
  declare titulo: string

  @column()
  declare valor_unitario: string

  @column()
  declare quantidade_itens: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Faturamentos)
  declare faturamentos: BelongsTo<typeof Faturamentos>

  @belongsTo(() => ContratoItens)
  declare contratoItens: BelongsTo<typeof ContratoItens>
}
