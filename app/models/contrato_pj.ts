import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Projeto from './projetos.js'

export default class ContratoPJ extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare razaoSocial: string

  @column()
  declare nomeFantasia: string

  @column()
  declare cnpj: string

  @column()
  declare enderecoCompleto: string

  @column()
  declare cidade: string

  @column()
  declare estado: string

  @column()
  declare telefoneEmpresa: string

  @column()
  declare emailEmpresa: string

  @column()
  declare representanteLegal: string

  @column()
  declare telefoneRepresentante: string

  @column()
  declare emailRepresentante: string

  @column()
  declare tipoContrato: 'tempo_determinado' | 'tempo_indeterminado' | 'projeto_especifico'

  @column.date()
  declare dataInicio: DateTime

  @column.date()
  declare dataFim: DateTime | null

  @column()
  declare valorMensal: number | null

  @column()
  declare valorHora: number | null

  @column()
  declare formaPagamento: 'pix' | 'transferencia_bancaria'

  @column()
  declare chavePix: string | null

  @column()
  declare banco: string | null

  @column()
  declare agencia: string | null

  @column()
  declare numeroConta: string | null

  @column()
  declare tipoConta: 'corrente' | 'poupanca' | null

  @column()
  declare nomeTitular: string | null

  @column()
  declare servicoPrestado:
    | 'analista_ui_ux'
    | 'analista_qualidade'
    | 'desenvolvedor'
    | 'analista'
    | 'gestor_projeto'
    | 'devops'
    | 'devsecops'

  @column()
  declare escopoTrabalho: string

  @column()
  declare observacao: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @manyToMany(() => Projeto, {
    pivotTable: 'contrato_pj_projetos', // Nome da tabela intermediária
    pivotColumns: ['servico_prestado', 'esforco_estimado', 'gestor_projeto'],
  })
  declare projetos: ManyToMany<typeof Projeto>

  static skipHooks = false
}
