import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Contratos from './contratos.js'
import Lancamentos from './lancamentos.js'
import FaturamentoItem from './faturamento_item.js'

export default class Faturamentos extends BaseModel {
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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contratos)
  declare contrato: BelongsTo<typeof Contratos>

  @hasMany(() => Lancamentos, { foreignKey: 'lancamento_id' })
  declare lancamentos: HasMany<typeof Lancamentos>

  @hasMany(() => FaturamentoItem, { foreignKey: 'faturamento_id' })
  declare faturamentoItens: HasMany<typeof FaturamentoItem>
}
