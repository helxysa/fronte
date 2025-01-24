import type { HttpContext } from '@adonisjs/core/http'
import ContratoPJProjeto from '#models/contrato_pj_projeto'
import ContratoPJ from '#models/contrato_pj'
import Logs from '#models/log'
import CurrentUserService from '#services/current_user_service'
import { DateTime } from 'luxon'
// import User from '#models/user'

export default class ContratoPjsController {
  async index({ response }: HttpContext) {
    const contratos = await ContratoPJ.query().preload('projetos') // Preload de projetos vinculados
    return response.ok(contratos)
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
      console.log(error)
      response.status(500).send('Erro ao criar o contrato PJ.')
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
        .update({ deletedAt: DateTime.local() })

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
}
