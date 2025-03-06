import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import RelatorioMensal from './relatorio_mensal.js'
import PagamentoAnexo from './pagamento_anexo.js'

export default class Pagamento extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare relatorioMensalId: number

  @column.date()
  declare encaminhadoEm: DateTime

  @column()
  declare valorPagamento: number

  @column()
  declare statusPagamento: 'aguardando_pagamento' | 'pago'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => RelatorioMensal)
  declare relatorioMensal: BelongsTo<typeof RelatorioMensal>

  @hasMany(() => PagamentoAnexo)
  declare anexos: HasMany<typeof PagamentoAnexo>
}
