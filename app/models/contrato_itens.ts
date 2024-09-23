import { DateTime } from 'luxon'
import { afterUpdate, BaseModel, beforeDelete, belongsTo, column } from '@adonisjs/lucid/orm'
import Contratos from '#models/contratos'
import LancamentoItens from '#models/lancamento_itens'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Renovacao from '#models/renovacao'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class ContratoItens extends compose(BaseModel, SoftDeletes) {
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

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratos, {
    foreignKey: 'contrato_id',
  })
  declare contratos: BelongsTo<typeof Contratos>

  @belongsTo(() => Renovacao)
  declare renovacao: BelongsTo<typeof Renovacao>

  // @beforeDelete()
  // static async setNullLancamentoItens(contratoItem: ContratoItens) {
  //   await LancamentoItens.query()
  //     .where('contrato_item_id', contratoItem.id)
  //     .update({ contrato_item_id: null })
  // }
}
