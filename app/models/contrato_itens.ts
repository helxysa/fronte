import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Contratos from '#models/contratos'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ContratoItens extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

  @column()
  declare titulo: string

  @column()
  declare unidadeMedida: string

  @column()
  declare valorUnitario: string

  @column()
  declare saldoQuantidadeContratada: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contratos, {
    foreignKey: 'contrato_id',
  })
  declare contratos: BelongsTo<typeof Contratos>
}
