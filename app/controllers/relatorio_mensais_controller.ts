import type { HttpContext } from '@adonisjs/core/http'
import RelatorioMensal from '#models/relatorio_mensal'
import ContratoPJ from '#models/contrato_pj'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import RelatorioMensalAnexo from '#models/relatorio_mensal_anexo'
import Pagamento from '#models/pagamento'

export default class RelatorioMensaisController {
  async index({ request, response }: HttpContext) {
    try {
      const { contratoPjId } = request.qs()

      const query = RelatorioMensal.query()
        .whereNull('deleted_at')
        .preload('projetos')
        .preload('contratoPj')
        .preload('anexos', (q) => {
          q.orderBy('created_at', 'desc')
        })

      if (contratoPjId) {
        query.where('contrato_pj_id', contratoPjId)
      }

      const relatorios = await query.exec()

      let prefixUrl = ''
      if (process.env.NODE_ENV === 'development') {
        // Você pode escolher qual URL usar em desenvolvimento
        // prefixUrl = 'http://localhost:3333/'
        prefixUrl = 'https://api-boss.msbtec.dev/'
      } else if (process.env.NODE_ENV === 'production') {
        prefixUrl = 'https://api-boss.msbtec.app/'
      }

      // Atualizar os campos relatorioAssinado e notaFiscal com os anexos mais recentes
      for (const relatorio of relatorios) {
        const relatorioAssinado = relatorio.anexos.find((a) => a.tipoAnexo === 'relatorio_assinado')
        const notaFiscal = relatorio.anexos.find((a) => a.tipoAnexo === 'nota_fiscal')

        relatorio.relatorioAssinado = relatorioAssinado
          ? `${prefixUrl}${relatorioAssinado.filePath}`
          : null
        relatorio.notaFiscal = notaFiscal ? `${prefixUrl}${notaFiscal.filePath}` : null

        // Remover a propriedade anexos para manter o formato original da resposta
        delete (relatorio as any).anexos
      }

      return response.ok(relatorios)
    } catch (error) {
      console.error('[index] Erro:', error)
      return response.status(500).json({ message: 'Erro ao buscar relatórios.' })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      const contratoPjId = request.input('contratoPjId')
      const contrato = await ContratoPJ.findOrFail(contratoPjId)

      // Formatar o periodoPrestacao para garantir uma data válida
      const periodoPrestacao = request.input('periodoPrestacao')

      // Criar o relatório com o período formatado
      const relatorio = await RelatorioMensal.create({
        contratoPjId,
        periodoPrestacao: periodoPrestacao,
        tipoExecucao: request.input('tipoExecucao'),
        horasExecutadas: request.input('horasExecutadas'),
        descricaoTarefas: request.input('descricaoTarefas'),
        status: 'pendente',
      })

      // Processar múltiplos anexos
      const relatoriosAssinados = request.files('relatoriosAssinados')
      const notasFiscais = request.files('notasFiscais')

      const anexos = []

      // Processar múltiplos relatórios assinados
      if (Array.isArray(relatoriosAssinados)) {
        for (const arquivo of relatoriosAssinados) {
          const anexo = await this.processarAnexo(arquivo, relatorio.id, 'relatorio_assinado')
          if (anexo) anexos.push(anexo)
        }
      }

      // Processar múltiplas notas fiscais
      if (Array.isArray(notasFiscais)) {
        for (const arquivo of notasFiscais) {
          const anexo = await this.processarAnexo(arquivo, relatorio.id, 'nota_fiscal')
          if (anexo) anexos.push(anexo)
        }
      }

      // Atualizar projetos
      const projetos = request.input('projetos')
      if (Array.isArray(projetos)) {
        await relatorio.related('projetos').attach(projetos)
      }

      // Atualizar status do relatório
      relatorio.status = this.verificarStatus({
        ...request.all(),
        relatorioAssinado: anexos.some((a) => a.tipoAnexo === 'relatorio_assinado'),
        notaFiscal: anexos.some((a) => a.tipoAnexo === 'nota_fiscal'),
      })
      await relatorio.save()

      await relatorio.load('projetos')
      await relatorio.load('contratoPj')

      return response.created({ relatorio, anexos })
    } catch (error) {
      console.error('[store] Erro:', error)
      return response.status(500).json({ message: 'Erro ao criar relatório.' })
    }
  }

  private async processarAnexo(
    file: any,
    relatorioId: number,
    tipoAnexo: 'relatorio_assinado' | 'nota_fiscal'
  ) {
    if (!file.isValid) {
      throw new Error(`Arquivo inválido: ${file.clientName}`)
    }

    const fileName = `${new Date().getTime()}-${file.clientName}`

    await file.move(app.publicPath('uploads/relatoriosMensais'), {
      name: fileName,
    })

    return await RelatorioMensalAnexo.create({
      relatorioMensalId: relatorioId,
      fileName: file.clientName,
      filePath: `uploads/relatoriosMensais/${fileName}`,
      fileType: file.extname,
      tipoAnexo,
    })
  }

  private verificarStatus(dados: any) {
    // Se o relatório já tiver um pagamento, manter seu status especial
    if (dados.status === 'pago' || dados.status === 'aguardando_pagamento') {
      return dados.status
    }

    const camposObrigatorios = [
      'periodoPrestacao',
      'tipoExecucao',
      'horasExecutadas',
      'descricaoTarefas',
      'relatorioAssinado',
      'notaFiscal',
    ]

    const todosPreenchidos = camposObrigatorios.every((campo) => dados[campo])
    return todosPreenchidos ? 'disponivel_pagamento' : 'pendente'
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const relatorio = await RelatorioMensal.findOrFail(params.id)

      // Verificar se existem pagamentos relacionados
      const pagamentosRelacionados = await Pagamento.query()
        .where('relatorio_mensal_id', relatorio.id)
        .whereNull('deleted_at')
        .first()

      if (pagamentosRelacionados) {
        return response.status(403).json({
          message: 'Não é possível excluir o relatório pois existem pagamentos relacionados a ele.',
        })
      }

      // Buscar e excluir anexos
      const anexos = await RelatorioMensalAnexo.query().where('relatorio_mensal_id', relatorio.id)

      for (const anexo of anexos) {
        const filePath = app.publicPath(anexo.filePath)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
        await anexo.delete()
      }

      await relatorio.delete()

      return response.ok({ message: 'Relatório e anexos excluídos com sucesso!' })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao tentar excluir o relatório.',
        details: error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const relatorio = await RelatorioMensal.findOrFail(params.id)

      // Atualizar dados básicos do relatório
      relatorio.merge({
        periodoPrestacao: request.input('periodoPrestacao', relatorio.periodoPrestacao),
        tipoExecucao: request.input('tipoExecucao', relatorio.tipoExecucao),
        horasExecutadas: request.input('horasExecutadas', relatorio.horasExecutadas),
        descricaoTarefas: request.input('descricaoTarefas', relatorio.descricaoTarefas),
      })

      const anexos = []

      // Processar novos anexos
      const relatoriosAssinados = request.files('relatoriosAssinados')
      const notasFiscais = request.files('notasFiscais')

      // Processar anexos para exclusão
      const anexosParaExcluir = request.input('anexosParaExcluir', [])
      if (Array.isArray(anexosParaExcluir) && anexosParaExcluir.length > 0) {
        for (const anexoId of anexosParaExcluir) {
          const anexo = await RelatorioMensalAnexo.find(anexoId)
          if (anexo && anexo.relatorioMensalId === relatorio.id) {
            const filePath = app.publicPath(anexo.filePath)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
            await anexo.delete()
          }
        }
      }

      // Adicionar novos relatórios assinados
      if (Array.isArray(relatoriosAssinados)) {
        for (const arquivo of relatoriosAssinados) {
          const anexo = await this.processarAnexo(arquivo, relatorio.id, 'relatorio_assinado')
          if (anexo) anexos.push(anexo)
        }
      }

      // Adicionar novas notas fiscais
      if (Array.isArray(notasFiscais)) {
        for (const arquivo of notasFiscais) {
          const anexo = await this.processarAnexo(arquivo, relatorio.id, 'nota_fiscal')
          if (anexo) anexos.push(anexo)
        }
      }

      // Atualizar projetos se fornecidos
      const projetos = request.input('projetos')
      if (Array.isArray(projetos)) {
        await relatorio.related('projetos').detach()
        await relatorio.related('projetos').attach(projetos)
      }

      // Buscar todos os anexos atuais para verificação de status
      const anexosAtuais = await RelatorioMensalAnexo.query().where(
        'relatorio_mensal_id',
        relatorio.id
      )

      // Atualizar status do relatório
      relatorio.status = this.verificarStatus({
        ...request.all(),
        relatorioAssinado: anexosAtuais.some((a) => a.tipoAnexo === 'relatorio_assinado'),
        notaFiscal: anexosAtuais.some((a) => a.tipoAnexo === 'nota_fiscal'),
      })

      await relatorio.save()

      // Carregar relacionamentos
      await relatorio.load('projetos')
      await relatorio.load('contratoPj')

      // Carregar todos os anexos atualizados
      const todosAnexos = await RelatorioMensalAnexo.query().where(
        'relatorio_mensal_id',
        relatorio.id
      )

      return response.ok({
        relatorio,
        anexos: todosAnexos,
      })
    } catch (error) {
      console.error('[update] Erro:', error)
      return response.status(500).json({
        message: 'Erro ao atualizar relatório.',
        details: error.message,
      })
    }
  }

  // Método auxiliar para listar anexos
  async listarAnexos({ params, response }: HttpContext) {
    try {
      const anexos = await RelatorioMensalAnexo.query()
        .where('relatorio_mensal_id', params.id)
        .orderBy('created_at', 'desc')

      return response.ok(anexos)
    } catch (error) {
      return response.status(500).json({
        message: 'Erro ao listar anexos.',
        details: error.message,
      })
    }
  }

  // Método auxiliar para excluir um anexo específico
  async excluirAnexo({ params, response }: HttpContext) {
    try {
      const anexo = await RelatorioMensalAnexo.findOrFail(params.anexoId)

      const filePath = app.publicPath(anexo.filePath)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      await anexo.delete()

      return response.ok({ message: 'Anexo excluído com sucesso!' })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao tentar excluir o anexo.',
        details: error.message,
      })
    }
  }

  // Renomear arquivo
  async renomearAnexo({ request, params, response }: HttpContext) {
    try {
      const anexo = await RelatorioMensalAnexo.findOrFail(params.anexoId)

      const newFileName = request.input('fileName')

      if (newFileName) {
        anexo.fileName = newFileName
      } else {
        return response.badRequest({ message: 'Nome do arquivo não fornecido.' })
      }

      await anexo.save()

      return response.ok({ message: 'Nome do anexo atualizado com sucesso!', anexo })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao tentar atualizar o nome do anexo.',
        details: error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const relatorio = await RelatorioMensal.query()
        .where('id', params.id)
        .whereNull('deleted_at')
        .preload('contratoPj', (query) => {
          query.select(['id', 'razao_social', 'nome_fantasia', 'cnpj'])
        })
        .preload('projetos')
        .firstOrFail()

      // Carregar anexos
      const anexos = await RelatorioMensalAnexo.query()
        .where('relatorio_mensal_id', relatorio.id)
        .orderBy('created_at', 'desc')

      return response.ok({
        relatorio,
        anexos,
      })
    } catch (error) {
      console.error('[show] Erro:', error)
      return response.status(500).json({
        message: 'Erro ao buscar relatório.',
        details: error.message,
      })
    }
  }
}
