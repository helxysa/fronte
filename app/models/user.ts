import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Profile from './profile.js'

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare profileId: number

  @belongsTo(() => Profile)
  declare profile: BelongsTo<typeof Profile>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '1 Day',
  })
}
