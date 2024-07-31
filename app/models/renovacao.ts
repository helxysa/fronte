import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Contratos from '#models/contratos'
import ContratoItens from './contrato_itens.js'
import Lancamentos from './lancamentos.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class Renovacao extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

  @column.date()
  declare data_inicio: DateTime

  @column.date()
  declare data_fim: DateTime

  @column()
  declare tipo_renovacao: string

  @column()
  declare porcentagem_renovacao: number

  @belongsTo(() => Contratos, {
    foreignKey: 'contrato_id',
  })
  declare contratos: BelongsTo<typeof Contratos>

  @hasMany(() => ContratoItens, { foreignKey: 'renovacao_id' })
  declare contratoItens: HasMany<typeof ContratoItens>

  @hasMany(() => Lancamentos, { foreignKey: 'renovacao_id' })
  declare lancamentos: HasMany<typeof Lancamentos>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}
