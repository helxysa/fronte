/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Contrato from '#models/contratos'
import ContratoItem from '#models/contrato_itens'
import Faturamento from '#models/faturamentos'
import FaturamentoItem from '#models/faturamento_item'
import Lancamento from '#models/lancamentos'
import LancamentoItens from '#models/lancamento_itens'
import { DateTime } from 'luxon'
import Renovacao from '#models/renovacao'
import Faturamentos from '#models/faturamentos'

export default class ContratosController {
  async createContract({ request, response }: HttpContext) {
    const {
      nome_contrato,
      nome_cliente,
      data_inicio,
      data_fim,
      lembrete_vencimento,
      observacoes,
      saldo_contrato,
      fiscal: { nome, telefone, email },
      ponto_focal,
      cidade,
      objeto_contrato,
      items,
    } = request.only([
      'nome_contrato',
      'nome_cliente',
      'data_inicio',
      'data_fim',
      'lembrete_vencimento',
      'observacoes',
      'saldo_contrato',
      'fiscal',
      'ponto_focal',
      'cidade',
      'objeto_contrato',
      'items',
    ])

    try {
      const novoContrato = await Contrato.create({
        nome_contrato,
        nome_cliente,
        data_inicio,
        data_fim,
        lembrete_vencimento,
        observacoes,
        saldo_contrato,
        fiscal: { nome, telefone, email },
        ponto_focal,
        cidade,
        objeto_contrato,
      })

      const contratoComItens = await Promise.all(
        items.map(
          async (item: {
            titulo: string
            unidade_medida: string
            valor_unitario: string
            saldo_quantidade_contratada: string
          }) => {
            const novoItem = await ContratoItem.create({
              contrato_id: novoContrato.id,
              titulo: item.titulo,
              unidade_medida: item.unidade_medida,
              valor_unitario: item.valor_unitario,
              saldo_quantidade_contratada: item.saldo_quantidade_contratada,
            })
            return novoItem
          }
        )
      )

      response.status(201).json({
        ...novoContrato.toJSON(),
        items: contratoComItens,
      })
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  async getContracts({ response }: HttpContext) {
    try {
      const contratos = await this.fetchContracts()
      return response.json(contratos)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  private async fetchContracts() {
    try {
      const contratos = await Contrato.query()
        .whereNull('deleted_at')
        .preload('contratoItens', (query) => {
          query.whereNull('renovacao_id').whereNull('deleted_at')
        })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery
            .whereNull('deleted_at')
            .select([
              'id',
              'contrato_id',
              'nota_fiscal',
              'data_faturamento',
              'status',
              'observacoes',
              'created_at',
              'updated_at',
            ])
            .preload('faturamentoItens', (faturamentoItensQuery) => {
              faturamentoItensQuery
                .whereNull('deleted_at')
                .preload('lancamento', (lancamentoQuery) => {
                  lancamentoQuery
                    .whereNull('deleted_at')
                    .select(['id', 'status', 'projetos', 'data_medicao'])
                    .preload('lancamentoItens', (lancamentoItensQuery) => {
                      lancamentoItensQuery
                        .whereNull('deleted_at')
                        .select(['id', 'unidade_medida', 'valor_unitario', 'quantidade_itens'])
                    })
                })
            })
        })
        .preload('lancamentos', (query) => {
          query.whereNull('deleted_at')
          query.whereNull('renovacao_id')
          query.preload('lancamentoItens')
        })
        .preload('renovacao', (query) => {
          query.whereNull('deleted_at')
          query.preload('contratoItens')
          query.preload('lancamentos', (lancamentoQuery) => {
            lancamentoQuery.whereNull('deleted_at')
            lancamentoQuery.preload('lancamentoItens')
          })
        })
        .exec()

      return contratos
    } catch (err) {
      console.error(err)
      throw new Error('Erro ao buscar contratos')
    }
  }

  async getContractById({ params, response }: HttpContext) {
    try {
      const contrato = await Contrato.query()
        .where('id', params.id)
        .whereNull('deleted_at')
        .preload('projetos')
        .preload('contratoItens', (query) => {
          query.whereNull('renovacao_id')
          query.whereNull('deleted_at')
        })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery
            .whereNull('deleted_at')
            .select([
              'id',
              'contrato_id',
              'nota_fiscal',
              'data_faturamento',
              'status',
              'observacoes',
              'created_at',
              'updated_at',
            ])
            .preload('faturamentoItens', (faturamentoItensQuery) => {
              faturamentoItensQuery
                .whereNull('deleted_at')
                .preload('lancamento', (lancamentoQuery) => {
                  lancamentoQuery
                    .whereNull('deleted_at')
                    .select(['id', 'status', 'projetos', 'data_medicao'])
                    .preload('lancamentoItens', (lancamentoItensQuery) => {
                      lancamentoItensQuery
                        .whereNull('deleted_at')
                        .select(['id', 'unidade_medida', 'valor_unitario', 'quantidade_itens'])
                    })
                })
            })
        })
        .preload('lancamentos', (query) => {
          query.whereNull('deleted_at')
          query.preload('lancamentoItens', (lancamentoItensQuery) => {
            lancamentoItensQuery.whereNull('deleted_at')
          })
        })
        .preload('renovacao', (query) => {
          query.whereNull('deleted_at')
          query.preload('contratoItens', (contratoItensQuery) => {
            contratoItensQuery.whereNull('deleted_at')
          })
          query.preload('lancamentos', (lancamentoQuery) => {
            lancamentoQuery.whereNull('deleted_at')
            lancamentoQuery.preload('lancamentoItens', (lancamentoItensQuery) => {
              lancamentoItensQuery.whereNull('deleted_at')
            })
          })
        })
        .first()

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      return response.json(contrato)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }

  async updateContract({ params, request, response }: HttpContext) {
    try {
      const {
        nome_contrato,
        nome_cliente,
        data_inicio,
        data_fim,
        lembrete_vencimento,
        observacoes,
        saldo_contrato,
        fiscal: { nome, telefone, email },
        ponto_focal,
        cidade,
        objeto_contrato,
        items,
      } = request.only([
        'nome_contrato',
        'nome_cliente',
        'data_inicio',
        'data_fim',
        'lembrete_vencimento',
        'observacoes',
        'saldo_contrato',
        'fiscal',
        'ponto_focal',
        'cidade',
        'objeto_contrato',
        'items',
      ])

      const contrato = await Contrato.find(params.id)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      contrato.nome_contrato = nome_contrato
      contrato.nome_cliente = nome_cliente
      contrato.data_inicio = data_inicio
      contrato.data_fim = data_fim
      contrato.lembrete_vencimento = lembrete_vencimento
      contrato.observacoes = observacoes
      contrato.saldo_contrato = saldo_contrato
      contrato.fiscal = { nome, telefone, email }
      contrato.ponto_focal = ponto_focal
      contrato.cidade = cidade
      contrato.objeto_contrato = objeto_contrato
      await contrato.save()

      // Atualiza os itens do contrato, se necessário
      if (items && items.length > 0) {
        await Promise.all(
          items.map(
            async (item: {
              id?: number
              titulo: string
              unidade_medida: string
              valor_unitario: string
              saldo_quantidade_contratada: string
            }) => {
              if (item.id) {
                // Atualiza item existente
                const contratoItem = await ContratoItem.find(item.id)
                if (contratoItem) {
                  contratoItem.titulo = item.titulo
                  contratoItem.unidade_medida = item.unidade_medida
                  contratoItem.valor_unitario = item.valor_unitario
                  contratoItem.saldo_quantidade_contratada = item.saldo_quantidade_contratada
                  await contratoItem.save()
                }
              } else {
                // Cria novo item
                await ContratoItem.create({
                  contrato_id: contrato.id,
                  titulo: item.titulo,
                  unidade_medida: item.unidade_medida,
                  valor_unitario: item.valor_unitario,
                  saldo_quantidade_contratada: item.saldo_quantidade_contratada,
                })
              }
            }
          )
        )
      }

      // Recarrega o contrato com os itens atualizados
      await contrato.load('contratoItens')

      return response.json(contrato)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }

  async deleteContract({ params, response }: HttpContext) {
    try {
      const contratoId = params.id
      const contrato = await Contrato.find(contratoId)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      // Soft delete nos contratos itens relacionados
      await ContratoItem.query()
        .where('contrato_id', contratoId)
        .update({ deletedAt: DateTime.local() })

      // Soft delete nos lançamentos relacionados
      const lancamentos = await Lancamento.query().where('contrato_id', contratoId)
      for (const lancamento of lancamentos) {
        await LancamentoItens.query()
          .where('lancamento_id', lancamento.id)
          .update({ deletedAt: DateTime.local() })
        await lancamento.merge({ deletedAt: DateTime.local() }).save()
      }

      // Soft delete nos faturamentos relacionados
      const faturamentos = await Faturamento.query().where('contrato_id', contratoId)
      for (const faturamento of faturamentos) {
        await FaturamentoItem.query()
          .where('faturamento_id', faturamento.id)
          .update({ deletedAt: DateTime.local() })
        await faturamento.merge({ deletedAt: DateTime.local() }).save()
      }

      //Soft delete nas renovacoes relacionadas
      await Renovacao.query()
        .where('contrato_id', contratoId)
        .update({ deletedAt: DateTime.local() })

      // Soft delete no contrato
      await contrato.merge({ deletedAt: DateTime.local() }).save()

      return response.status(202).json({ message: 'Contrato deletado com sucesso.' })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }

  async restoreContract({ params, response }: HttpContext) {
    try {
      const contratoId = params.id

      const contrato: any = await Contrato.withTrashed().where('id', contratoId).firstOrFail()

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      // Restaurar os contratos itens relacionados
      await ContratoItem.query()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')
        .update({ deleted_at: null })

      // Restaurar os lançamentos relacionados
      const lancamentos: any = await Lancamento.withTrashed()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')

      for (const lancamento of lancamentos) {
        await LancamentoItens.query()
          .where('lancamento_id', lancamento.id)
          .whereNotNull('deleted_at')
          .update({ deleted_at: null })
        await lancamento.merge({ deletedAt: null }).save()
      }

      // Restaurar os faturamentos relacionados
      const faturamentos: any = await Faturamento.withTrashed()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')

      for (const faturamento of faturamentos) {
        await FaturamentoItem.query()
          .where('faturamento_id', faturamento.id)
          .whereNotNull('deleted_at')
          .update({ deleted_at: null })
        await faturamento.merge({ deletedAt: null }).save()
      }

      // Restaurar as renovações relacionadas
      await Renovacao.query()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')
        .update({ deleted_at: null })

      // Restaurar o contrato
      await contrato.merge({ deleted_at: null }).save()

      return response.status(202).json({ message: 'Contrato restaurado com sucesso.' })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }

  async getDoughnut({ response }: HttpContext) {
    const totalResult = await Contrato.query().whereNull('deleted_at').count('* as total')
    const totalContratos = totalResult[0]?.$extras?.total || 0

    const contratos = await this.fetchContracts()

    const { stampTotalAguardandoFaturamento, stampTotalAguardandoPagamento, stampTotalPago } =
      await this.getStampData(contratos)

    const stampTotalValorContratado = contratos.reduce((acc, contrato) => {
      const saldo = Number(contrato.saldo_contrato) || 0
      return acc + saldo
    }, 0)

    const [aguardandoFaturamentoResult, aguardandoPagamentoResult, pagoResult] = await Promise.all([
      Faturamentos.query().where('status', 'Aguardando Faturamento').count('* as total'),
      Faturamentos.query().where('status', 'Aguardando Pagamento').count('* as total'),
      Faturamentos.query().where('status', 'Pago').count('* as total'),
    ])
    const totalAguardandoFaturamento = aguardandoFaturamentoResult[0].$extras.total || 0
    const totalAguardandoPagamento = aguardandoPagamentoResult[0].$extras.total || 0
    const totalPago = pagoResult[0].$extras.total || 0

    return response.json({
      doughnut: {
        total_contratos: Number(totalContratos),
        total_aguardando_faturamento: Number(totalAguardandoFaturamento),
        total_aguardando_pagamento: Number(totalAguardandoPagamento),
        total_pago: Number(totalPago),
      },
      top5: [],
      stamps: {
        total_valor_contratado: stampTotalValorContratado,
        total_aguardando_faturamento: stampTotalAguardandoFaturamento,
        total_aguardando_pagamento: stampTotalAguardandoPagamento,
        total_pago: stampTotalPago,
      },
      map: [],
      contratos: contratos,
    })
  }

  async getStampData(contratos: any[]) {
    const STATUS_AGUARDANDO_FATURAMENTO = 'Aguardando Faturamento'
    const STATUS_AGUARDANDO_PAGAMENTO = 'Aguardando Pagamento'
    const STATUS_PAGO = 'Pago'

    const calculateTotalByStatus = (status: string) => {
      return contratos.reduce((total, contrato) => {
        return (
          total +
          contrato.faturamentos
            .filter((faturamento: any) => faturamento.status === status)
            .flatMap((faturamento: any) => faturamento.faturamentoItens)
            .flatMap((faturamentoItem: any) => faturamentoItem.lancamento.lancamentoItens)
            .reduce((sum: any, itemLancamento: any) => {
              const quantidadeItens = Number.parseFloat(itemLancamento.quantidade_itens) || 0
              const valorUnitario = Number.parseFloat(itemLancamento.valor_unitario) || 0
              return sum + quantidadeItens * valorUnitario
            }, 0)
        )
      }, 0)
    }

    // Calcula e retorna os totais para cada status
    return {
      stampData: {
        stampTotalAguardandoFaturamento: await calculateTotalByStatus(
          STATUS_AGUARDANDO_FATURAMENTO
        ),
        stampTotalAguardandoPagamento: await calculateTotalByStatus(STATUS_AGUARDANDO_PAGAMENTO),
        stampTotalPago: await calculateTotalByStatus(STATUS_PAGO),
      },
    }
  }
}
