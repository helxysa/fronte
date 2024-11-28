import { DateTime } from 'luxon'
import {
  afterCreate,
  afterUpdate,
  BaseModel,
  belongsTo,
  column,
  hasMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Contratos from './contratos.js'
import Faturamentos from './faturamentos.js'
import LancamentoItens from './lancamento_itens.js'
import Renovacao from '#models/renovacao'
import MedicaoAnexo from '#models/medicao_anexo'
import FaturamentoItem from './faturamento_item.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'
import CurrentUserService from '#services/current_user_service'
import Logs from './log.js'

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
  declare dias: number

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

  @hasMany(() => MedicaoAnexo, { foreignKey: 'contrato_id' })
  declare medicaoAnexo: HasMany<typeof MedicaoAnexo>

  static skipHooks = false
  @afterCreate()
  static async logCreate(medicao: Lancamentos) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      const contrato = await medicao.related('contratos').query().first()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Medição',
        modelId: medicao.id,
        description: `${username} criou a medição com id ${medicao.id} no contrato ${contrato?.nome_contrato || ''}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }

  @afterUpdate()
  static async logUpdate(medicao: Lancamentos) {
    if (this.skipHooks) return
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      const contrato = await medicao.related('contratos').query().first()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Atualizar',
        model: 'Medição',
        modelId: medicao.id,
        description: `${username} atualizou a medição com id ${medicao.id} no contrato ${contrato?.nome_contrato || ''}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
