import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Faturamentos from './faturamentos.js'
import Lancamentos from './lancamentos.js'

export default class FaturamentoItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare faturamento_id: number

  @column()
  declare lancamento_id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Faturamentos, { foreignKey: 'faturamento_id' })
  declare faturamento: BelongsTo<typeof Faturamentos>

  @belongsTo(() => Lancamentos, { foreignKey: 'lancamento_id' })
  declare lancamento: BelongsTo<typeof Lancamentos>
}
