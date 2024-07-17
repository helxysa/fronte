import { DateTime } from 'luxon'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import ContratoItens from './contrato_itens.js'
import Faturamentos from './faturamentos.js'
import Renovacao from './renovacao.js'

export default class Contratos extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nome_cliente: string

  @column.date()
  declare data_inicio: DateTime

  @column.date()
  declare data_fim: DateTime

  @column()
  declare observacoes: string

  @column()
  declare saldo_contrato: string

  @column()
  declare fiscal: string

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

  @hasMany(() => ContratoItens, {
    foreignKey: 'contrato_id',
  })
  declare contratoItens: HasMany<typeof ContratoItens>

  @hasMany(() => Renovacao, {
    foreignKey: 'contrato_id',
  })
  declare renovacao: HasMany<typeof Renovacao>

  @hasMany(() => Faturamentos, { foreignKey: 'contrato_id' })
  declare faturamentos: HasMany<typeof Faturamentos>
}
