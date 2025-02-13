import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import ContratoPJ from './contrato_pj.js'
import Projeto from './projetos.js'

export default class RelatorioMensal extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contratoPjId: number

  @column.date()
  declare periodoPrestacao: DateTime

  @column()
  declare tipoExecucao: 'demanda' | 'mensal'

  @column()
  declare horasExecutadas: number

  @column()
  declare descricaoTarefas: string

  @column()
  declare relatorioAssinado: string | null

  @column()
  declare notaFiscal: string | null

  @column()
  declare status: 'pendente' | 'disponivel_pagamento'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => ContratoPJ)
  declare contratoPj: BelongsTo<typeof ContratoPJ>

  @manyToMany(() => Projeto)
  declare projetos: ManyToMany<typeof Projeto>
}
