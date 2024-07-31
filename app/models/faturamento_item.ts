import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Faturamentos from './faturamentos.js'
import Lancamentos from './lancamentos.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class FaturamentoItem extends compose(BaseModel, SoftDeletes) {
  total(total: any, arg1: number) {
    throw new Error('Method not implemented.')
  }
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

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Faturamentos, { foreignKey: 'faturamento_id' })
  declare faturamento: BelongsTo<typeof Faturamentos>

  @belongsTo(() => Lancamentos, { foreignKey: 'lancamento_id' })
  declare lancamento: BelongsTo<typeof Lancamentos>
}
