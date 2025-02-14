import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import ContratoPJ from './contrato_pj.js'
import Projeto from './projetos.js'
import RelatorioMensalAnexo from './relatorio_mensal_anexo.js'

export default class RelatorioMensal extends BaseModel {
  static table = 'relatorio_mensais'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contratoPjId: number

  @column()
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

  @manyToMany(() => Projeto, {
    pivotTable: 'relatorios_mensal_projetos',
  })
  declare projetos: ManyToMany<typeof Projeto>

  @hasMany(() => RelatorioMensalAnexo)
  declare anexos: HasMany<typeof RelatorioMensalAnexo>
}
