import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Lancamentos from './lancamentos.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ContratoItens from './contrato_itens.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class LancamentoItens extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare lancamento_id: number

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

  @column()
  declare convertido: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Lancamentos, { foreignKey: 'lancamento_id' })
  declare lancamentos: BelongsTo<typeof Lancamentos>

  @belongsTo(() => ContratoItens)
  declare contratoItens: BelongsTo<typeof ContratoItens>
}
