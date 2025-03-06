import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Contratoclt extends BaseModel {
  static table = 'contrato_clts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare matricula: string

  @column()
  declare nomeCompleto: string

  @column()
  declare cpf: string

  @column()
  declare rg: string

  @column()
  declare pis: string

  @column.date()
  declare dataNascimento: DateTime

  @column()
  declare enderecoCompleto: string

  @column()
  declare telefone: string

  @column()
  declare emailPessoal: string

  @column.date()
  declare dataAdmissao: DateTime

  @column()
  declare cargo: string

  @column()
  declare nivelProfissional: string

  @column()
  declare departamento: string

  @column()
  declare projetoAtual: string | null

  @column()
  declare gestorProjeto: string | null

  @column()
  declare regimeTrabalho: string

  @column()
  declare horarioTrabalho: string

  @column()
  declare jornadaSemanal: number

  @column()
  declare remuneracao: number

  @column()
  declare formaPagamento: string

  @column()
  declare chavePix: string | null

  @column()
  declare banco: string | null

  @column()
  declare agencia: string | null

  @column()
  declare numeroConta: string | null

  @column()
  declare planoSaude: boolean

  @column()
  declare empresaPlanoSaude: string

  @column()
  declare valeTransporte: boolean

  @column()
  declare valorValeTransporte: number

  @column()
  declare valeAlimentacao: boolean

  @column()
  declare valorValeAlimentacao: number

  @column()
  declare outrosBeneficios: string | null

  @column()
  declare observacao: string | null

  @column()
  declare documentos: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
