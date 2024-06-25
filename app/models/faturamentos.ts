import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Contratos from './contratos.js'
import FaturamentoItens from './faturamento_itens.js'

export default class Faturamentos extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contratoId: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contratos)
  declare contratos: BelongsTo<typeof Contratos>

  @hasMany(() => FaturamentoItens)
  declare faturamentoItens: HasMany<typeof FaturamentoItens>
}
