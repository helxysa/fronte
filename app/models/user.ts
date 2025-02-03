import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo, afterCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Profile from './profile.js'
import Logs from './log.js'
import CurrentUserService from '#services/current_user_service'
import ContratoPJ from './contrato_pj.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare nome: string

  @column()
  declare cargo: string

  @column()
  declare setor: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare passwordExpiredAt: Date | null

  @column()
  declare passwordResetToken: string | null

  @column()
  declare passwordChanged: boolean

  @column()
  declare prestador_servicos: boolean

  @column()
  declare contrato_pj_id: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare profileId: number

  @belongsTo(() => Profile)
  declare profile: BelongsTo<typeof Profile>

  // Relacionamento opcional com ContratoPJ
  @belongsTo(() => ContratoPJ, {
    foreignKey: 'contrato_pj_id',
  })
  declare contratoPJ: BelongsTo<typeof ContratoPJ>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '1 Day',
  })

  @afterCreate()
  static async logCreate(user: User) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Usuário',
        modelId: user.id,
        description: `${username} criou o usuário com id ${user.id}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
