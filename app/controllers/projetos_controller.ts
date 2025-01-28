/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Projeto from '#models/projetos'
import CurrentUserService from '#services/current_user_service'
import Logs from '#models/log'
import { DateTime } from 'luxon'

export default class ProjetosController {
  async index({ params, response }: HttpContext) {
    const { contrato_id } = params
    try {
      const projetos = await Projeto.query()
        .where('contrato_id', contrato_id)
        .whereNull('deleted_at')
        .orderBy('projeto', 'asc')

      if (projetos.length <= 0) {
        return response.json({
          status: 'success',
          message: 'Não foi possível encontrar projetos cadastrados.',
        })
      }

      return response.json({
        status: 'success',
        data: projetos,
        message: 'Projetos recuperados com sucesso',
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao recuperar os projetos',
        error: error.message,
      })
    }
  }

  async getAllProjects({ response }: HttpContext) {
    try {
      const projetos = await Projeto.query().whereNull('deleted_at').orderBy('projeto', 'asc')

      if (projetos.length === 0) {
        return response.json({
          status: 'success',
          message: 'Nenhum projeto foi encontrado.',
        })
      }

      return response.json({
        status: 'success',
        data: projetos,
        message: 'Todos os projetos foram recuperados com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao buscar os projetos.',
        error: error.message,
      })
    }
  }

  async store({ params, request, response }: HttpContext) {
    const { contrato_id } = params
    const { projeto } = request.only(['projeto'])

    const projetoExistente = await Projeto.query()
      .where('contrato_id', contrato_id)
      .where('projeto', projeto)
      .first()

    if (projetoExistente) {
      return response.status(400).json({
        status: 'error',
        message: 'Já existe um projeto com esse nome para este contrato.',
      })
    }

    try {
      const novoProjeto = await Projeto.create({ projeto, contrato_id })
      return response.status(201).json({
        status: 'success',
        data: novoProjeto,
        message: 'Projeto criado com sucesso!',
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao criar o projeto',
        error: error.message,
      })
    }
  }

  async storeMultiple({ params, request, response }: HttpContext) {
    const { contrato_id } = params
    const { projetos } = request.only(['projetos'])

    if (!Array.isArray(projetos) || projetos.length === 0) {
      return response.status(400).json({
        status: 'error',
        message: 'É necessário fornecer um array de nomes de projetos.',
      })
    }

    try {
      const nomesUnicos = new Set(projetos)
      if (nomesUnicos.size !== projetos.length) {
        return response.status(400).json({
          status: 'error',
          message: 'Não são permitidos nomes de projetos duplicados.',
        })
      }

      const projetosExistentes = await Projeto.query()
        .where('contrato_id', contrato_id)
        .whereIn('projeto', projetos)

      if (projetosExistentes.length > 0) {
        return response.status(400).json({
          status: 'error',
          message: 'Um ou mais projetos já existem para este contrato.',
        })
      }

      const projetosCriados = await Projeto.createMany(
        projetos.map((nome) => ({ projeto: nome, contrato_id }))
      )

      return response.status(201).json({
        status: 'success',
        data: projetosCriados,
        message: 'Todos os projetos foram criados com sucesso!',
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao criar os projetos',
        error: error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const projeto = await Projeto.findOrFail(params.id)
      return response.json({
        status: 'success',
        data: projeto,
        message: 'Projeto recuperado com sucesso!',
      })
    } catch (error) {
      return response.status(404).json({
        status: 'error',
        message: 'Projeto não encontrado',
        error: error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const projeto = await Projeto.findOrFail(params.id)
      const { projeto: projetoData, contrato_id } = request.only(['projeto', 'contrato_id'])

      const projetoExistente = await Projeto.query()
        .where('contrato_id', contrato_id)
        .where('projeto', projetoData)
        .whereNot('id', params.id)
        .first()

      if (projetoExistente) {
        return response.status(400).json({
          status: 'error',
          message: 'Já existe um projeto com esse nome para este contrato.',
        })
      }

      projeto.merge({ projeto: projetoData, contrato_id })
      await projeto.save()

      return response.json({
        status: 'success',
        data: projeto,
        message: 'Projeto atualizado com sucesso!',
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao atualizar o projeto',
        error: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const projeto = await Projeto.findOrFail(params.id)

      const userId = CurrentUserService.getCurrentUserId()
      const username = CurrentUserService.getCurrentUsername()

      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Deletar',
        model: 'Projeto',
        modelId: projeto.id,
        description: `${username} excluiu o projeto "${projeto.projeto}" com ID ${projeto.id}.`,
      })

      // await projeto.delete()
      projeto.merge({ deletedAt: DateTime.local() })
      await projeto.save()

      return response.json({
        status: 'success',
        message: 'Projeto deletado com sucesso!',
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao deletar o projeto',
        error: error.message,
      })
    }
  }
}
