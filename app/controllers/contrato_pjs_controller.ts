import type { HttpContext } from '@adonisjs/core/http'
import ContratoPJProjeto from '#models/contrato_pj_projeto'
import ContratoPJ from '#models/contrato_pj'
import Logs from '#models/log'
import CurrentUserService from '#services/current_user_service'
import { DateTime } from 'luxon'
// import User from '#models/user'

export default class ContratoPjsController {
  async index({ request, response }: HttpContext) {
    try {
      const { search, dataInicio, dataFim } = request.qs()

      const contratosQuery = ContratoPJ.query().whereNull('deleted_at').preload('projetos')

      if (search) {
        contratosQuery.where((query) => {
          query
            // .where('cnpj', 'like', `%${search}%`)
            .orWhere('razao_social', 'ilike', `%${search}%`)
            .orWhere('nome_fantasia', 'ilike', `%${search}%`)
            .orWhere('representante_legal', 'ilike', `%${search}%`)
            .orWhere('servico_prestado', 'ilike', `%${search}%`)
        })
      }

      if (dataInicio) {
        contratosQuery.where('dataInicio', '>=', dataInicio)
      }

      if (dataFim) {
        contratosQuery.where('dataFim', '<=', dataFim)
      }

      const contratos = await contratosQuery.exec()
      return response.ok(contratos)
    } catch (error) {
      console.error('[index] Erro:', error)
      return response.status(500).json({ message: 'Erro ao buscar contratos.' })
    }
  }

  async showContractPJ({ params, response }: HttpContext) {
    try {
      const contrato = await ContratoPJ.query()
        .where('id', params.id)
        .whereNull('deleted_at')
        .preload('projetos', (query) => {
          query.pivotColumns(['servico_prestado', 'esforco_estimado', 'gestor_projeto'])
        })
        .firstOrFail()

      // Os campos da tabela contrato_pj_projeto(pivot) vieram dentro do $extras
      // Aparentemente, o Adonis 6 não traz os dados da coluna intermediária automaticamente.
      // Portanto precisei serializar o contrato e incluir os campos da tabela intermediária
      const contratoSerializado = {
        ...contrato.serialize(), // Serializa o contrato
        projetos: contrato.projetos.map((projeto) => ({
          ...projeto.serialize(),
          servico_prestado: projeto.$extras.pivot_servico_prestado,
          esforco_estimado: projeto.$extras.pivot_esforco_estimado,
          gestor_projeto: projeto.$extras.pivot_gestor_projeto,
        })),
      }

      return response.json(contratoSerializado)
    } catch (error) {
      console.error('[showContractPJ] Erro:', error)
      return response.status(404).json({ message: 'Contrato não encontrado.' })
    }
  }

  async createContractPJ({ request, response }: HttpContext) {
    const {
      razaoSocial,
      nomeFantasia,
      cnpj,
      enderecoCompleto,
      cidade,
      estado,
      telefoneEmpresa,
      emailEmpresa,
      representanteLegal,
      telefoneRepresentante,
      emailRepresentante,
      tipoContrato,
      dataInicio,
      dataFim,
      valorMensal,
      valorHora,
      formaPagamento,
      chavePix,
      banco,
      agencia,
      numeroConta,
      tipoConta,
      nomeTitular,
      servicoPrestado,
      escopoTrabalho,
      observacao,
    } = request.only([
      'razaoSocial',
      'nomeFantasia',
      'cnpj',
      'enderecoCompleto',
      'cidade',
      'estado',
      'telefoneEmpresa',
      'emailEmpresa',
      'representanteLegal',
      'telefoneRepresentante',
      'emailRepresentante',
      'tipoContrato',
      'dataInicio',
      'dataFim',
      'valorMensal',
      'valorHora',
      'formaPagamento',
      'chavePix',
      'banco',
      'agencia',
      'numeroConta',
      'tipoConta',
      'nomeTitular',
      'servicoPrestado',
      'escopoTrabalho',
      'observacao',
    ])

    const projetos = request.input('projetos') // Array de projetos

    try {
      // Ajustar data de fim para contratos indeterminados
      let ajustadoDataFim = dataFim
      if (tipoContrato === 'tempo_indeterminado' || tipoContrato === 'projeto_especifico') {
        ajustadoDataFim = null
      }

      // Criar o contrato PJ
      const novoContrato = await ContratoPJ.create({
        razaoSocial,
        nomeFantasia,
        cnpj,
        enderecoCompleto,
        cidade,
        estado,
        telefoneEmpresa,
        emailEmpresa,
        representanteLegal,
        telefoneRepresentante,
        emailRepresentante,
        tipoContrato,
        dataInicio,
        dataFim: ajustadoDataFim,
        valorMensal,
        valorHora,
        formaPagamento,
        chavePix,
        banco,
        agencia,
        numeroConta,
        tipoConta,
        nomeTitular,
        servicoPrestado,
        escopoTrabalho,
        observacao,
      })

      // Vincular projetos ao contrato
      if (Array.isArray(projetos)) {
        await Promise.all(
          projetos.map(async (projeto) => {
            await ContratoPJProjeto.create({
              contratoPjId: novoContrato.id,
              projetoId: projeto.projetoId,
              servicoPrestado: projeto.servicoPrestado,
              esforcoEstimado: projeto.esforcoEstimado,
              gestorProjeto: projeto.gestorProjeto,
            })
          })
        )
      }

      // Preload dos projetos vinculados
      await novoContrato.load('projetos')

      response.status(201).json(novoContrato)
    } catch (error) {
      console.error('[createContractPJ] Erro:', error)

      return response.status(500).json({
        message: 'Não foi possível criar o contrato PJ.',
        error: error.message,
      })
    }
  }

  async updateContractPJ({ params, request, response }: HttpContext) {
    const contratoId = params.id

    const {
      razaoSocial,
      nomeFantasia,
      cnpj,
      enderecoCompleto,
      cidade,
      estado,
      telefoneEmpresa,
      emailEmpresa,
      representanteLegal,
      telefoneRepresentante,
      emailRepresentante,
      tipoContrato,
      dataInicio,
      dataFim,
      valorMensal,
      valorHora,
      formaPagamento,
      chavePix,
      banco,
      agencia,
      numeroConta,
      tipoConta,
      nomeTitular,
      servicoPrestado,
      escopoTrabalho,
      observacao,
    } = request.only([
      'razaoSocial',
      'nomeFantasia',
      'cnpj',
      'enderecoCompleto',
      'cidade',
      'estado',
      'telefoneEmpresa',
      'emailEmpresa',
      'representanteLegal',
      'telefoneRepresentante',
      'emailRepresentante',
      'tipoContrato',
      'dataInicio',
      'dataFim',
      'valorMensal',
      'valorHora',
      'formaPagamento',
      'chavePix',
      'banco',
      'agencia',
      'numeroConta',
      'tipoConta',
      'nomeTitular',
      'servicoPrestado',
      'escopoTrabalho',
      'observacao',
    ])

    const projetos = request.input('projetos') // Array de projetos

    try {
      const contrato = await ContratoPJ.findOrFail(contratoId)

      // Ajustar data de fim para contratos indeterminados
      let ajustadoDataFim = dataFim
      if (tipoContrato === 'tempo_indeterminado' || tipoContrato === 'projeto_especifico') {
        ajustadoDataFim = null
      }

      // Atualizar os dados do contrato
      contrato.merge({
        razaoSocial,
        nomeFantasia,
        cnpj,
        enderecoCompleto,
        cidade,
        estado,
        telefoneEmpresa,
        emailEmpresa,
        representanteLegal,
        telefoneRepresentante,
        emailRepresentante,
        tipoContrato,
        dataInicio,
        dataFim: ajustadoDataFim,
        valorMensal,
        valorHora,
        formaPagamento,
        chavePix,
        banco,
        agencia,
        numeroConta,
        tipoConta,
        nomeTitular,
        servicoPrestado,
        escopoTrabalho,
        observacao,
      })

      await contrato.save()

      // Atualizar os projetos vinculados
      if (Array.isArray(projetos)) {
        // Remove os projetos antigos vinculados ao contrato
        await ContratoPJProjeto.query().where('contrato_pj_id', contrato.id).delete()

        // Adiciona os novos projetos
        await Promise.all(
          projetos.map(async (projeto) => {
            await ContratoPJProjeto.create({
              contratoPjId: contrato.id,
              projetoId: projeto.projetoId,
              servicoPrestado: projeto.servicoPrestado,
              esforcoEstimado: projeto.esforcoEstimado,
              gestorProjeto: projeto.gestorProjeto,
            })
          })
        )
      }

      response.status(200).json({
        message: 'Contrato atualizado com sucesso!',
        contrato: contrato.toJSON(),
      })
    } catch (error) {
      console.error(error)
      response.status(500).send('Erro ao atualizar o contrato PJ.')
    }
  }

  async deleteContractPJ({ params, response }: HttpContext) {
    try {
      const contratoId = params.id
      const contrato = await ContratoPJ.find(contratoId)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado.' })
      }

      ContratoPJ.skipHooks = true

      // Soft delete nos projetos relacionados
      await ContratoPJProjeto.query()
        .where('contrato_pj_id', contratoId)
        .update({ deleted_at: DateTime.local() })

      // Soft delete no contrato
      await contrato.merge({ deletedAt: DateTime.local() }).save()

      // Log de exclusão
      try {
        const userId = CurrentUserService.getCurrentUserId()
        const username = CurrentUserService.getCurrentUsername()
        await Logs.create({
          userId: userId || 0,
          name: username || 'Usuário',
          action: 'Deletar',
          model: 'ContratoPJ',
          modelId: contrato.id,
          description: `Usuário ${username} excluiu o contrato PJ "${contrato.razaoSocial}" com ID ${contrato.id}.`,
        })
      } catch (logError) {
        console.error('Erro ao criar o log de exclusão:', logError)
      }

      return response.status(202).json({ message: 'Contrato deletado com sucesso.' })
    } catch (error) {
      console.error('Erro ao excluir contrato:', error)
      return response.status(500).send('Erro no servidor.')
    } finally {
      // Garantir que a flag seja desativada
      ContratoPJ.skipHooks = false
    }
  }

  async restoreContractPJ({ params, response }: HttpContext) {
    try {
      const contratoId = params.id

      const contrato = await ContratoPJ.query()
        .where('id', contratoId)
        .whereNotNull('deletedAt')
        .first()

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato excluído não encontrado.' })
      }

      await contrato.merge({ deletedAt: null }).save()

      await ContratoPJProjeto.query()
        .where('contrato_pj_id', contratoId)
        .whereNotNull('deleted_at')
        .update({ deleted_at: null })

      // Log de restauração
      try {
        const userId = CurrentUserService.getCurrentUserId()
        const username = CurrentUserService.getCurrentUsername()
        await Logs.create({
          userId: userId || 0,
          name: username || 'Usuário',
          action: 'Restaurar',
          model: 'ContratoPJ',
          modelId: contrato.id,
          description: `Usuário ${username} restaurou o contrato PJ "${contrato.razaoSocial}" com ID ${contrato.id}.`,
        })
      } catch (logError) {
        console.error('Erro ao criar o log de restauração:', logError)
      }

      return response.status(200).json({ message: 'Contrato restaurado com sucesso.' })
    } catch (error) {
      console.error('Erro ao restaurar contrato:', error)
      return response.status(500).send('Erro no servidor.')
    }
  }
}
