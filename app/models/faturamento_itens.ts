import { DateTime } from 'luxon'
console.log(DateTime)
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Faturamentos from './faturamentos.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ContratoItens from './contrato_itens.js'

export default class FaturamentoItens extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare faturamento_id: number

  @column()
  declare contrato_item_id: number

  @column()
  declare titulo: string

  @column()
  declare unidade_medida: string

  @column()
  declare valor_unitario: string

  @column()
  declare saldo_quantidade_contratada: string

  @column()
  declare quantidade_itens: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Faturamentos, { foreignKey: 'faturamento_id' })
  declare faturamentos: BelongsTo<typeof Faturamentos>

  @belongsTo(() => ContratoItens)
  declare contratoItens: BelongsTo<typeof ContratoItens>
}
