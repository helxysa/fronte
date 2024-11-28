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
import Lancamentos from './lancamentos.js'
import FaturamentoItem from './faturamento_item.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'
import CurrentUserService from '#services/current_user_service'
import Logs from './log.js'

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

  @column()
  declare competencia: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratos, { foreignKey: 'contrato_id' })
  declare contrato: BelongsTo<typeof Contratos>

  @hasMany(() => Lancamentos, { foreignKey: 'lancamento_id' })
  declare lancamentos: HasMany<typeof Lancamentos>

  @hasMany(() => FaturamentoItem, { foreignKey: 'faturamento_id' })
  declare faturamentoItens: HasMany<typeof FaturamentoItem>

  static skipHooks = false
  @afterCreate()
  static async logCreate(fat: Faturamentos) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      const contrato = await fat.related('contrato').query().first()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Faturamento',
        modelId: fat.id,
        description: `${username} criou o faturamento com id ${fat.id} no contrato ${contrato?.nome_contrato || ''}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }

  @afterUpdate()
  static async logUpdate(fat: Faturamentos) {
    if (this.skipHooks) return
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      const contrato = await fat.related('contrato').query().first()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Atualizar',
        model: 'Faturamento',
        modelId: fat.id,
        description: `${username} atualizou o faturamento com id ${fat.id} no contrato ${contrato?.nome_contrato || ''}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
