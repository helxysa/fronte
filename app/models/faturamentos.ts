import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Contratos from './contratos.js'
import Lancamentos from './lancamentos.js'
import FaturamentoItem from './faturamento_item.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class Faturamentos extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

  @column()
  declare nota_fiscal: string

  @column()
  declare data_faturamento: DateTime

  @column()
  declare descricao_nota: string

  @column()
  declare status: string

  @column()
  declare observacoes: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratos)
  declare contrato: BelongsTo<typeof Contratos>

  @hasMany(() => Lancamentos, { foreignKey: 'lancamento_id' })
  declare lancamentos: HasMany<typeof Lancamentos>

  @hasMany(() => FaturamentoItem, { foreignKey: 'faturamento_id' })
  declare faturamentoItens: HasMany<typeof FaturamentoItem>
}
