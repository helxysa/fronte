import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import RelatorioMensal from './relatorio_mensal.js'

export default class RelatorioMensalAnexo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare relatorioMensalId: number

  @column()
  declare fileName: string

  @column()
  declare filePath: string

  @column()
  declare fileType: string

  @column()
  declare tipoAnexo: 'relatorio_assinado' | 'nota_fiscal'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => RelatorioMensal)
  declare relatorioMensal: BelongsTo<typeof RelatorioMensal>
}
