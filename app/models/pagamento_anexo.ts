import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Pagamento from './pagamento.js'

export default class PagamentoAnexo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare pagamentoId: number

  @column()
  declare fileName: string

  @column()
  declare filePath: string

  @column()
  declare fileType: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Pagamento)
  declare pagamento: BelongsTo<typeof Pagamento>
}
