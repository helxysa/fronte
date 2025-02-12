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
  declare situacao:
    | 'Aguardando Autorização'
    | 'Em Desenvolvimento'
    | 'Em Sustentação'
    | 'Parado'
    | 'Finalizado'

  @column.date()
  declare data_inicio: DateTime

  @column.date()
  declare data_prevista: DateTime | null

  @column()
  declare nome_dono_regra: string

  @column()
  declare nome_gestor: string

  @column()
  declare analista_responsavel: string

  @column()
  declare contrato_id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Contratos, { foreignKey: 'contrato_id' })
  declare contratos: BelongsTo<typeof Contratos>

  @manyToMany(() => ContratoPJ, {
    pivotTable: 'contrato_pj_projetos', // Nome da tabela intermediária
    pivotForeignKey: 'projeto_id',
    pivotRelatedForeignKey: 'contrato_pj_id',
    pivotColumns: ['servico_prestado', 'esforco_estimado', 'gestor_projeto'],
  })
  declare contratoPJ: ManyToMany<typeof ContratoPJ>

  // // Validação para garantir que o nome do projeto seja único por contrato
  // static async validateUniqueNome(nomeProjeto: string, contratoId: number, projetoId?: number) {
  //   const query = Projeto.query().where('projeto', nomeProjeto).where('contrato_id', contratoId)
  //   if (projetoId) {
  //     query.whereNot('id', projetoId)
  //   }
  //   const existingProject = await query.first()
  //   if (existingProject) {
  //     throw new Error('Já existe um projeto com esse nome para este contrato.')
  //   }
  // }

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
