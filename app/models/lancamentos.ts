import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Contratos from './contratos.js'
import Faturamentos from './faturamentos.js'
import LancamentoItens from './lancamento_itens.js'
import Renovacao from '#models/renovacao'
import FaturamentoItem from './faturamento_item.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'

export default class Lancamentos extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

  @column()
  declare renovacao_id: number

  @column()
  declare status: string

  @column()
  declare tarefa_medicao: string

  @column()
  declare tipo_medicao: string

  @column()
  declare data_medicao: DateTime | null

  @column()
  declare projetos: string

  @column()
  declare competencia: string

  @column()
  declare descricao: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratos, { foreignKey: 'contrato_id' })
  declare contratos: BelongsTo<typeof Contratos>

  @belongsTo(() => Faturamentos, { foreignKey: 'faturamento_id' })
  declare faturamento: BelongsTo<typeof Faturamentos>

  @belongsTo(() => Renovacao, { foreignKey: 'renovacao_id' })
  declare renovacao: BelongsTo<typeof Renovacao>

  @hasMany(() => LancamentoItens, { foreignKey: 'lancamento_id' })
  declare lancamentoItens: HasMany<typeof LancamentoItens>

  @hasMany(() => FaturamentoItem)
  declare faturamentoItens: HasMany<typeof FaturamentoItem>
}
