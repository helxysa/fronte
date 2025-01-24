import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  afterCreate,
  afterUpdate,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import ContratoPJ from './contrato_pj.js'
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

  @manyToMany(() => ContratoPJ, {
    pivotTable: 'contrato_pj_projetos', // Nome da tabela intermediária
    pivotColumns: ['servico_prestado', 'esforco_estimado', 'gestor_projeto'],
  })
  declare contratosPJ: ManyToMany<typeof ContratoPJ>

  static skipHooks = false
  @afterCreate()
  static async logCreate(projeto: Projeto) {
    try {
      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()
      const contrato = await projeto.related('contratos').query().first()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Criar',
        model: 'Projeto',
        modelId: projeto.id,
        description: `${username} criou o projeto "${projeto.projeto}" com id ${projeto.id} no contrato ${contrato?.nome_contrato || 'desconhecido'}.`,
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
      const contrato = await projeto.related('contratos').query().first()
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Atualizar',
        model: 'Projeto',
        modelId: projeto.id,
        description: `${username} atualizou o projeto "${projeto.projeto}" com id ${projeto.id} no contrato ${contrato?.nome_contrato || 'desconhecido'}.`,
      })
    } catch (error) {
      console.error('Não foi possível criar log: ', error)
    }
  }
}
