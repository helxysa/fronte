/* eslint-disable prettier/prettier */
import type { HttpContext } from '@adonisjs/core/http'
import ContratoPJProjeto from '#models/contrato_pj_projeto'
import ContratoPJ from '#models/contrato_pj'
import Logs from '#models/log'
import CurrentUserService from '#services/current_user_service'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import Profile from '#models/profile'
import db from '@adonisjs/lucid/services/db'
import UserContratoPJ from '#models/user_contrato_pj'

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

    const trx = await db.transaction()
    const projetos = request.input('projetos') // Array de projetos
    const DEFAULT_PASSWORD = 'Boss1234'
    let textoUrl = process.env.NODE_ENV === 'development' ? 'https://boss.msbtec.dev' : 'https://boss.msbtec.app'
    const perfilPrestador = await Profile.findBy('name', 'Prestador de Serviços', { client: trx }) //Busca Perfil
    if (!perfilPrestador) {
      throw new Error('Perfil "Prestador de Serviços" não encontrado no sistema')
    }

    try {
      // Ajustar data de fim para contratos indeterminados
      let ajustadoDataFim = dataFim
      if (tipoContrato === 'tempo_indeterminado' || tipoContrato === 'projeto_especifico') {
        ajustadoDataFim = null
      }

      // Verificar se já existe um contrato ativo com o mesmo CNPJ
      const contratoExistente = await ContratoPJ.query().where('cnpj', cnpj).where('status', 'ativo').first();
      if (contratoExistente) {
        return response.status(400).json({
          message: 'Já existe um contrato ativo com este CNPJ.',
        });
      }

      // Verificar se já existe um usuário com este email
      const usuarioExistente = await User.query()
        .where('email', emailEmpresa)
        .preload('contratosPj', (query) => {
          query.pivotColumns(['situacao'])
            .where('situacao', 'ativo')
        })
        .first()

      // Verificar se tem contrato ativo
      if (usuarioExistente && usuarioExistente.contratosPj?.length > 0) {
        return response.status(400).json({
          message: 'Este usuário já possui um contrato ativo.',
        })
      }

      // Criar o contrato PJ
      const novoContrato = await ContratoPJ.create(
        {
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
          status: 'ativo',
        },
        { client: trx }
      )

      // Vincular projetos ao contrato
      if (Array.isArray(projetos)) {
        await Promise.all(
          projetos.map(async (projeto) => {
            await ContratoPJProjeto.create(
              {
                contratoPjId: novoContrato.id,
                projetoId: projeto.projetoId,
                servicoPrestado: projeto.servicoPrestado,
                esforcoEstimado: projeto.esforcoEstimado,
                gestorProjeto: projeto.gestorProjeto,
              },
              { client: trx }
            )
          })
        )
      }

      // Preload dos projetos vinculados
      await novoContrato.load('projetos')

      let novoUsuario: User

      if (usuarioExistente) {
        // Se o usuário já existe, apenas atualiza os campos necessários
        novoUsuario = await usuarioExistente.merge({
          nome: razaoSocial,
          prestador_servicos: true,
          cnpj: cnpj,
          ...(perfilPrestador ? { profileId: perfilPrestador.id } : {}),
        }).save()

        // Não envia email pois o usuário já existe
      } else {
        // Se é um novo usuário, cria com senha padrão
        novoUsuario = await User.create(
          {
            email: emailEmpresa,
            nome: razaoSocial,
            password: DEFAULT_PASSWORD,
            prestador_servicos: true,
            cnpj: cnpj,
            ...(perfilPrestador ? { profileId: perfilPrestador.id } : {}),
          },
          { client: trx }
        )

        // Envia email apenas para novos usuários
        await mail
          .send((message) => {
            message
              .to(novoUsuario.email)
              .from(env.get('SMTP_USERNAME'))
              .subject('Acesso ao Sistema - Credenciais de Acesso').html(`
                <h1>Olá, ${novoUsuario.nome}!</h1>
                <p>Sua conta foi criada com sucesso.</p>
                <p><strong>Senha Padrão:</strong> ${DEFAULT_PASSWORD}</p>
                <p><a href="${textoUrl}">Clique aqui</a> para acessar o sistema.</p>
                <p>Recomendamos alterar sua senha após o primeiro acesso.</p>
                <br />
                <p>Atenciosamente,</p>
                <p>Equipe Boss.</p>
              `)
          })
          .catch((error) => {
            console.error('Erro ao enviar e-mail:', error)
          })
      }

      // Criar vínculo na tabela intermediária
      await UserContratoPJ.create(
        {
          userId: novoUsuario.id,
          contratoPjId: novoContrato.id,
          situacao: 'ativo',
        },
        { client: trx }
      )

      await trx.commit()

      return response.status(201).json({
        message: usuarioExistente
          ? 'Contrato criado e vinculado ao usuário existente com sucesso!'
          : 'Contrato e novo usuário criados com sucesso!',
        contrato: novoContrato,
        usuario: novoUsuario,
      })
    } catch (error) {
      await trx.rollback()
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

      // Atualizar status do contrato para inativo
      await contrato.merge({ status: 'inativo' }).save()

      // Atualizar situacao na tabela intermediária
      await UserContratoPJ.query()
        .where('contrato_pj_id', contratoId)
        .update({ situacao: 'inativo' })

      // Log de inativação
      try {
        const userId = CurrentUserService.getCurrentUserId()
        const username = CurrentUserService.getCurrentUsername()
        await Logs.create({
          userId: userId || 0,
          name: username || 'Usuário',
          action: 'Inativar',
          model: 'ContratoPJ',
          modelId: contrato.id,
          description: `Usuário ${username} inativou o contrato PJ "${contrato.razaoSocial}" com ID ${contrato.id}.`,
        })
      } catch (logError) {
        console.error('Erro ao criar o log de inativação:', logError)
      }

      return response.status(200).json({ message: 'Contrato inativado com sucesso.' })
    } catch (error) {
      console.error('Erro ao inativar contrato:', error)
      return response.status(500).send('Erro no servidor.')
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

  async getActiveContractByUser({ response }: HttpContext) {
    try {
      const userId = CurrentUserService.getCurrentUserId();

      if (userId === null) {
        return response.status(400).json({ message: 'Usuário não encontrado.' });
      }

      const user = await User.query()
        .where('id', userId)
        .preload('contratosPj', (query) => {
          query.where('situacao', 'ativo');
        })
        .firstOrFail();

      const contratoAtivo = user.contratosPj[0] // Pega o primeiro (e único) contrato ativo

      if (!contratoAtivo) {
        return response.status(404).json({
          message: 'Nenhum contrato ativo encontrado para este usuário.',
        })
      }

      return response.json({ contratoAtivo })
    } catch (error) {
      console.error('[getActiveContractByUser] Erro:', error)
      return response.status(500).json({ message: 'Erro ao buscar contrato ativo do usuário.' })
    }
  }
}
