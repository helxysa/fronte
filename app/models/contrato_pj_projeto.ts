import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ContratoPjProjeto extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contratoPjId: number // Referência ao contrato PJ

  @column()
  declare projetoId: number // Referência ao projeto

  @column()
  declare servicoPrestado: string

  @column()
  declare esforcoEstimado: string

  @column()
  declare gestorProjeto: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
