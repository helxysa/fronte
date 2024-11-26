import { DateTime } from 'luxon'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import {
  BaseModel,
  column,
  hasMany,
  belongsTo,
  afterCreate,
  afterUpdate,
} from '@adonisjs/lucid/orm'
import ContratoItens from './contrato_itens.js'
import Lancamentos from './lancamentos.js'
import Renovacao from './renovacao.js'
import Faturamentos from './faturamentos.js'
import Projetos from './projetos.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { compose } from '@adonisjs/core/helpers'
import ContratoAnexo from './contrato_anexo.js'
import Logs from './log.js'
import CurrentUserService from '#services/current_user_service'

export default class Contratos extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare termo_aditivo_id: number | null

  @column()
  declare nome_contrato: string

  @column()
  declare nome_cliente: string

  @column.date()
  declare data_inicio: DateTime

  @column.date()
  declare data_fim: DateTime

  @column()
  declare lembrete_vencimento: string

  @column()
  declare observacoes: string

  @column()
  declare saldo_contrato: string

  @column()
  declare fiscal: { nome: string; telefone: string; email: string }

  @column()
  declare ponto_focal: string

  @column()
  declare cidade: string

  @column()
  declare estado: string

  @column()
  declare objeto_contrato: string

  @column()
  declare foto: string | null

  @column()
  declare porcentagem_ajuste: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => ContratoItens, {
    foreignKey: 'contrato_id',
  })
  declare contratoItens: HasMany<typeof ContratoItens>

  @hasMany(() => ContratoAnexo, { foreignKey: 'contrato_id' })
  declare contratoAnexo: HasMany<typeof ContratoAnexo>

  @hasMany(() => Projetos, { foreignKey: 'contrato_id' })
  declare projetos: HasMany<typeof Projetos>
  @hasMany(() => Renovacao, {
    foreignKey: 'contrato_id',
  })
  declare renovacao: HasMany<typeof Renovacao>

  @hasMany(() => Lancamentos, { foreignKey: 'contrato_id' })
  declare lancamentos: HasMany<typeof Lancamentos>

  @hasMany(() => Faturamentos, { foreignKey: 'contrato_id' })
  declare faturamentos: HasMany<typeof Faturamentos>

  // Relação para o contrato original (caso seja um termo aditivo)
  @belongsTo(() => Contratos, { foreignKey: 'termo_aditivo_id' })
  declare contrato: BelongsTo<typeof Contratos>

  // Relação para os termos aditivos deste contrato
  @hasMany(() => Contratos, { foreignKey: 'termo_aditivo_id' })
  declare termosAditivos: HasMany<typeof Contratos>

  static skipHooks = false
  @afterCreate()
  static async logCreate(contrato: Contratos) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Contrato',
        modelId: contrato.id,
        description: `Usuário ${username} criou o contrato "${contrato.nome_contrato}" com id ${contrato.id}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }

  @afterUpdate()
  static async logUpdate(contrato: Contratos) {
    if (this.skipHooks) return
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Atualizar',
        model: 'Contrato',
        modelId: contrato.id,
        description: `Usuário ${username} atualizou o contrato "${contrato.nome_contrato}" com id ${contrato.id}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
