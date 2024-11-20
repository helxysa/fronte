import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, afterCreate, afterUpdate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Contratos from './contratos.js'
import CurrentUserService from '#services/current_user_service'
import Logs from './log.js'

export default class Projeto extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projeto: string

  @column()
  declare contrato_id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contratos, { foreignKey: 'contrato_id' })
  declare contratos: BelongsTo<typeof Contratos>

  static skipHooks = false
  @afterCreate()
  static async logCreate(projeto: Projeto) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Projeto',
        modelId: projeto.id,
        description: `Usuário ${username} criou o projeto "${projeto.projeto}" com id ${projeto.id}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }

  @afterUpdate()
  static async logUpdate(projeto: Projeto) {
    if (this.skipHooks) return
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Atualizar',
        model: 'Projeto',
        modelId: projeto.id,
        description: `Usuário ${username} atualizou o projeto "${projeto.projeto}" com id ${projeto.id}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
