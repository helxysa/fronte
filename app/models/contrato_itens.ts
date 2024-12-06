import { DateTime } from 'luxon'
import { afterCreate, afterUpdate, BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Contratos from '#models/contratos'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Renovacao from '#models/renovacao'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'
import CurrentUserService from '#services/current_user_service'
import Logs from './log.js'

export default class ContratoItens extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contrato_id: number

  @column()
  declare renovacao_id: number

  @column()
  declare titulo: string

  @column()
  declare unidade_medida: string

  @column()
  declare valor_unitario: string

  @column()
  declare saldo_quantidade_contratada: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratos, {
    foreignKey: 'contrato_id',
  })
  declare contratos: BelongsTo<typeof Contratos>

  @belongsTo(() => Renovacao)
  declare renovacao: BelongsTo<typeof Renovacao>

  static skipHooks = false

  @afterCreate()
  static async logCreate(contratoItem: ContratoItens) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      const contrato = await contratoItem.related('contratos').query().first()

      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Itens',
        modelId: contratoItem.id,
        description: `${username} criou o item "${contratoItem.titulo}" com id ${contratoItem.id} no contrato ${contrato?.nome_contrato || ''}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }

  @afterUpdate()
  static async logUpdate(contratoItem: ContratoItens) {
    if (this.skipHooks) return
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      const contrato = await contratoItem.related('contratos').query().first()

      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Atualizar',
        model: 'Itens',
        modelId: contratoItem.id,
        description: `${username} atualizou o item "${contratoItem.titulo}" com id ${contratoItem.id} no contrato ${contrato?.nome_contrato || ''}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
