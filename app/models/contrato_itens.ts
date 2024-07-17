import { DateTime } from 'luxon'
import { BaseModel, beforeDelete, belongsTo, column } from '@adonisjs/lucid/orm'
import Contratos from '#models/contratos'
import FaturamentoItens from '#models/faturamento_itens'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Renovacao from '#models/renovacao'

export default class ContratoItens extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

  @column()
  declare renovacao_id: number

  @column()
  declare titulo: string

  @column()
  declare unidade_medida: string

  @column()
  declare valor_unitario: string

  @column()
  declare saldo_quantidade_contratada: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contratos, {
    foreignKey: 'contrato_id',
  })
  declare contratos: BelongsTo<typeof Contratos>

  @belongsTo(() => Renovacao)
  declare renovacao: BelongsTo<typeof Renovacao>

  @beforeDelete()
  static async setNullFaturamentoItems(contratoItem: ContratoItens) {
    await FaturamentoItens.query()
      .where('contrato_item_id', contratoItem.id)
      .update({ contrato_item_id: null })
  }
}
