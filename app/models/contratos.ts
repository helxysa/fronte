import { DateTime } from 'luxon'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import ContratoItens from './contrato_itens.js'
import Lancamentos from './lancamentos.js'
import Renovacao from './renovacao.js'
import Faturamentos from './faturamentos.js'
import Projetos from './projetos.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'
export default class Contratos extends compose(BaseModel, SoftDeletes) {
  [x: string]: number
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nome_contrato: string

  @column()
  declare nome_cliente: string

  @column.date()
  declare data_inicio: DateTime

  @column.date()
  declare data_fim: DateTime

  @column()
  declare lembrete_vencimento: string

  @column()
  declare observacoes: string

  @column()
  declare saldo_contrato: string

  @column()
  declare fiscal: { nome: string; telefone: string; email: string }

  @column()
  declare ponto_focal: string

  @column()
  declare cidade: string

  @column()
  declare objeto_contrato: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => ContratoItens, {
    foreignKey: 'contrato_id',
  })
  declare contratoItens: HasMany<typeof ContratoItens>

  @hasMany(() => Projetos, { foreignKey: 'contrato_id' })
  declare projetos: HasMany<typeof Projetos>
  @hasMany(() => Renovacao, {
    foreignKey: 'contrato_id',
  })
  declare renovacao: HasMany<typeof Renovacao>

  @hasMany(() => Lancamentos, { foreignKey: 'contrato_id' })
  declare lancamentos: HasMany<typeof Lancamentos>

  @hasMany(() => Faturamentos, { foreignKey: 'contrato_id' })
  declare faturamentos: HasMany<typeof Faturamentos>
}
