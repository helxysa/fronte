import { DateTime } from 'luxon'
import { afterCreate, afterUpdate, BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Permission from './permission.js'
import Logs from './log.js'
import CurrentUserService from '#services/current_user_service'

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Permission)
  declare permissions: HasMany<typeof Permission>

  static skipHooks = false
  @afterCreate()
  static async logCreate(profile: Profile) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Perfil',
        modelId: profile.id,
        description: `Usuário ${username} criou o perfil "${profile.name}" com id ${profile.id}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }

  @afterUpdate()
  static async logUpdate(profile: Profile) {
    if (this.skipHooks) return
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Atualizar',
        model: 'Perfil',
        modelId: profile.id,
        description: `Usuário ${username} atualizou o perfil "${profile.name}" com id ${profile.id}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
