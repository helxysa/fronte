import type { HttpContext } from '@adonisjs/core/http'
import Pagamento from '#models/pagamento'
import RelatorioMensal from '#models/relatorio_mensal'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import PagamentoAnexo from '#models/pagamento_anexo'

export default class PagamentosController {
  async index({ request, response }: HttpContext) {
    try {
      const { relatorioMensalId } = request.qs()

      const query = Pagamento.query()
        .whereNull('deleted_at')
        .preload('relatorioMensal', (queryRelatorio) => {
          queryRelatorio.preload('contratoPj').preload('projetos')
        })
        .preload('anexos')

      if (relatorioMensalId) {
        query.where('relatorio_mensal_id', relatorioMensalId)
      }

      const pagamentos = await query.exec()

      let prefixUrl = ''
      if (process.env.NODE_ENV === 'development') {
        prefixUrl = 'https://api-boss.msbtec.dev/'
      } else if (process.env.NODE_ENV === 'production') {
        prefixUrl = 'https://api-boss.msbtec.app/'
      }

      // Formatar URLs para os anexos
      for (const pagamento of pagamentos) {
        if (pagamento.anexos && pagamento.anexos.length > 0) {
          pagamento.anexos.forEach((anexo) => {
            anexo.filePath = `${prefixUrl}${anexo.filePath}`
          })
        }
      }

      return response.ok(pagamentos)
    } catch (error) {
      console.error('[index] Erro:', error)
      return response.status(500).json({ message: 'Erro ao buscar pagamentos.' })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      const relatorioMensalId = request.input('relatorioMensalId')

      // Verificar se o relatório mensal existe
      const relatorioMensal = await RelatorioMensal.findOrFail(relatorioMensalId)

      // Verificar se o relatório está disponível para pagamento
      if (relatorioMensal.status !== 'disponivel_pagamento') {
        return response.status(400).json({
          message: 'Relatório mensal não está disponível para pagamento.',
        })
      }

      // Verificar se já existe um pagamento para este relatório mensal
      const pagamentoExistente = await Pagamento.query()
        .where('relatorio_mensal_id', relatorioMensalId)
        .whereNull('deleted_at')
        .first()

      if (pagamentoExistente) {
        return response.status(400).json({
          message: 'Já existe um pagamento registrado para este relatório mensal.',
        })
      }

      // Criar pagamento
      const pagamento = await Pagamento.create({
        relatorioMensalId,
        encaminhadoEm: request.input('encaminhadoEm'),
        valorPagamento: request.input('valorPagamento'),
        statusPagamento: request.input('statusPagamento', 'aguardando_pagamento'),
      })

      // Processar anexos
      const anexos = request.files('anexos')
      const anexosSalvos = []

      if (Array.isArray(anexos) && anexos.length > 0) {
        for (const arquivo of anexos) {
          const anexo = await this.processarAnexo(arquivo, pagamento.id)
          if (anexo) anexosSalvos.push(anexo)
        }
      }

      // Carregar dados relacionados
      await pagamento.load('relatorioMensal', (queryRelatorio) => {
        queryRelatorio.preload('contratoPj').preload('projetos')
      })

      return response.created({ pagamento, anexos: anexosSalvos })
    } catch (error) {
      console.error('[store] Erro:', error)
      return response.status(500).json({ message: 'Erro ao criar pagamento.' })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const pagamento = await Pagamento.query()
        .where('id', params.id)
        .whereNull('deleted_at')
        .preload('relatorioMensal', (queryRelatorio) => {
          queryRelatorio.preload('contratoPj').preload('projetos')
        })
        .preload('anexos')
        .firstOrFail()

      let prefixUrl = ''
      if (process.env.NODE_ENV === 'development') {
        prefixUrl = 'https://api-boss.msbtec.dev/'
      } else if (process.env.NODE_ENV === 'production') {
        prefixUrl = 'https://api-boss.msbtec.app/'
      }

      // Formatar URLs dos anexos
      if (pagamento.anexos && pagamento.anexos.length > 0) {
        pagamento.anexos.forEach((anexo) => {
          anexo.filePath = `${prefixUrl}${anexo.filePath}`
        })
      }

      return response.ok(pagamento)
    } catch (error) {
      console.error('[show] Erro:', error)
      return response.status(500).json({ message: 'Erro ao buscar pagamento.' })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const pagamento = await Pagamento.findOrFail(params.id)

      // Verificar se está tentando mudar o relatório mensal
      const novoRelatorioMensalId = request.input('relatorioMensalId')

      if (novoRelatorioMensalId && novoRelatorioMensalId !== pagamento.relatorioMensalId) {
        // Verificar se o novo relatório existe
        const novoRelatorio = await RelatorioMensal.findOrFail(novoRelatorioMensalId)

        // Verificar se o relatório está disponível para pagamento
        if (novoRelatorio.status !== 'disponivel_pagamento') {
          return response.status(400).json({
            message: 'O novo relatório mensal não está disponível para pagamento.',
          })
        }

        // Verificar se já existe um pagamento para o novo relatório mensal
        const pagamentoExistente = await Pagamento.query()
          .where('relatorio_mensal_id', novoRelatorioMensalId)
          .whereNull('deleted_at')
          .where('id', '!=', pagamento.id) // Ignorar o próprio pagamento que está sendo atualizado
          .first()

        if (pagamentoExistente) {
          return response.status(400).json({
            message: 'Já existe um pagamento registrado para o relatório mensal selecionado.',
          })
        }

        // Se tudo estiver ok, permitir a mudança
        pagamento.relatorioMensalId = novoRelatorioMensalId
      }

      // Atualizar dados básicos
      pagamento.merge({
        encaminhadoEm: request.input('encaminhadoEm', pagamento.encaminhadoEm),
        valorPagamento: request.input('valorPagamento', pagamento.valorPagamento),
        statusPagamento: request.input('statusPagamento', pagamento.statusPagamento),
      })

      await pagamento.save()

      // Processar anexos
      const anexos = request.files('anexos')
      const anexosSalvos = []

      if (Array.isArray(anexos) && anexos.length > 0) {
        for (const arquivo of anexos) {
          const anexo = await this.processarAnexo(arquivo, pagamento.id)
          if (anexo) anexosSalvos.push(anexo)
        }
      }

      // Processar exclusão de anexos
      const anexosParaExcluir = request.input('anexosParaExcluir', [])
      if (Array.isArray(anexosParaExcluir) && anexosParaExcluir.length > 0) {
        for (const anexoId of anexosParaExcluir) {
          const anexo = await PagamentoAnexo.find(anexoId)
          if (anexo && anexo.pagamentoId === pagamento.id) {
            const filePath = app.publicPath(anexo.filePath)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
            await anexo.delete()
          }
        }
      }

      // Carregar dados relacionados
      await pagamento.load('relatorioMensal', (queryRelatorio) => {
        queryRelatorio.preload('contratoPj').preload('projetos')
      })

      // Buscar todos os anexos atualizados
      const todosAnexos = await PagamentoAnexo.query().where('pagamento_id', pagamento.id)

      return response.ok({
        pagamento,
        anexos: todosAnexos,
      })
    } catch (error) {
      console.error('[update] Erro:', error)
      return response.status(500).json({ message: 'Erro ao atualizar pagamento.' })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const pagamento = await Pagamento.findOrFail(params.id)

      // Buscar e excluir anexos
      const anexos = await PagamentoAnexo.query().where('pagamento_id', pagamento.id)

      for (const anexo of anexos) {
        const filePath = app.publicPath(anexo.filePath)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
        await anexo.delete()
      }

      await pagamento.delete()

      return response.ok({ message: 'Pagamento e anexos excluídos com sucesso!' })
    } catch (error) {
      console.error('[destroy] Erro:', error)
      return response.status(500).json({ message: 'Erro ao excluir pagamento.' })
    }
  }

  private async processarAnexo(file: any, pagamentoId: number) {
    if (!file.isValid) {
      throw new Error(`Arquivo inválido: ${file.clientName}`)
    }

    const fileName = `${new Date().getTime()}-${file.clientName}`

    await file.move(app.publicPath('uploads/pagamentos'), {
      name: fileName,
    })

    return await PagamentoAnexo.create({
      pagamentoId,
      fileName: file.clientName,
      filePath: `uploads/pagamentos/${fileName}`,
      fileType: file.extname,
    })
  }

  // Métodos auxiliares para gerenciar anexos individualmente
  async listarAnexos({ params, response }: HttpContext) {
    try {
      const anexos = await PagamentoAnexo.query()
        .where('pagamento_id', params.id)
        .orderBy('created_at', 'desc')

      let prefixUrl = ''
      if (process.env.NODE_ENV === 'development') {
        prefixUrl = 'https://api-boss.msbtec.dev/'
      } else if (process.env.NODE_ENV === 'production') {
        prefixUrl = 'https://api-boss.msbtec.app/'
      }

      // Formatar URLs
      for (const anexo of anexos) {
        anexo.filePath = `${prefixUrl}${anexo.filePath}`
      }

      return response.ok(anexos)
    } catch (error) {
      return response.status(500).json({
        message: 'Erro ao listar anexos.',
        details: error.message,
      })
    }
  }

  async excluirAnexo({ params, response }: HttpContext) {
    try {
      const anexo = await PagamentoAnexo.findOrFail(params.anexoId)

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

  async renomearAnexo({ request, params, response }: HttpContext) {
    try {
      const anexo = await PagamentoAnexo.findOrFail(params.anexoId)

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
}
