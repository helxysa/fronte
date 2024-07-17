/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Contrato from '#models/contratos'
import ContratoItem from '#models/contrato_itens'
import Renovacao from '#models/renovacao'
import Faturamentos from '#models/faturamentos'
import FaturamentoItens from '#models/faturamento_itens'

export default class RenovacaoController {
  async createRenovacao({ params, request, response }: HttpContext) {
    const { data_inicio, data_fim, tipo_renovacao, porcentagem_renovacao, contrato_itens } =
      request.only([
        'data_inicio',
        'data_fim',
        'tipo_renovacao',
        'porcentagem_renovacao',
        'contrato_itens',
      ])

    try {
      const contrato = await Contrato.find(params.id)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      const novaRenovacao = await Renovacao.create({
        contrato_id: contrato.id,
        data_inicio: data_inicio,
        data_fim: data_fim,
        tipo_renovacao: tipo_renovacao,
        porcentagem_renovacao: porcentagem_renovacao,
      })

      if (contrato_itens && contrato_itens.length > 0) {
        await Promise.all(
          contrato_itens.map(
            async (item: {
              titulo: string
              unidade_medida: string
              valor_unitario: string
              saldo_quantidade_contratada: string
            }) => {
              const novoItem = await ContratoItem.create({
                contrato_id: contrato.id,
                renovacao_id: novaRenovacao.id,
                titulo: item.titulo,
                unidade_medida: item.unidade_medida,
                valor_unitario: item.valor_unitario,
                saldo_quantidade_contratada: item.saldo_quantidade_contratada,
              })
              return novoItem
            }
          )
        )
      }

      await novaRenovacao.load('contratoItens')

      response.status(201).json({ renovacao: novaRenovacao })
    } catch (err) {
      console.error(err)
      response.status(500).send('Erro ao renovar contrato')
    }
  }

  async createRenovacaoItens({ params, request, response }: HttpContext) {
    const contratoItens = request.input('contrato_itens')

    try {
      const renovacao = await Renovacao.find(params.renovacao_id)
      if (!renovacao) {
        return response.status(404).json({ message: 'Renovação não encontrada' })
      }

      const novosContratoItens = await Promise.all(
        contratoItens.map(
          async (item: {
            titulo: string
            unidade_medida: string
            valor_unitario: string
            saldo_quantidade_contratada: string
          }) => {
            return await ContratoItem.create({
              contrato_id: renovacao.contrato_id,
              renovacao_id: renovacao.id,
              titulo: item.titulo,
              unidade_medida: item.unidade_medida,
              valor_unitario: item.valor_unitario,
              saldo_quantidade_contratada: item.saldo_quantidade_contratada,
            })
          }
        )
      )

      return response.status(201).json(novosContratoItens)
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao criar itens de renovação' })
    }
  }

  async createFaturamentoRenovacao({ request, response, params }: HttpContext) {
    const { renovacao_id } = params
    const { status, itens, projetos, data_pagamento } = request.only([
      'status',
      'itens',
      'projetos',
      'data_pagamento',
    ])

    try {
      const renovacao = await Renovacao.find(renovacao_id)
      if (!renovacao) {
        return response.status(404).json({ message: 'Renovação não encontrada' })
      }

      const novoFaturamento = await Faturamentos.create({
        contrato_id: renovacao.contrato_id,
        renovacao_id: renovacao.id,
        status,
        projetos,
        data_pagamento,
      })

      const faturamentoComItens = await Promise.all(
        itens.map(async (item: { id_item: number; quantidade_itens: string }) => {
          const contratoItem = await ContratoItem.query()
            .where('id', item.id_item)
            .andWhere('renovacao_id', renovacao.id)
            .first()

          if (!contratoItem || !contratoItem.renovacao_id) {
            throw new Error(
              `Item de contrato com id ${item.id_item} não encontrado ou não associado à renovação.`
            )
          }

          const novoItem = await FaturamentoItens.create({
            faturamento_id: novoFaturamento.id,
            contrato_item_id: contratoItem.id,
            titulo: contratoItem.titulo,
            unidade_medida: contratoItem.unidade_medida,
            valor_unitario: contratoItem.valor_unitario,
            saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
            quantidade_itens: item.quantidade_itens,
          })
          return novoItem
        })
      )

      return response.status(201).json({
        ...novoFaturamento.toJSON(),
        itens: faturamentoComItens,
      })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async addItemToFaturamento({ params, request, response }: HttpContext) {
    const { contrato_item_id, quantidade_itens } = request.only([
      'contrato_item_id',
      'quantidade_itens',
    ])
    const { faturamento_id } = params

    try {
      const faturamento = await Faturamentos.findOrFail(faturamento_id)

      const contratoItem = await ContratoItem.query()
        .where('id', contrato_item_id)
        .andWhere('renovacao_id', faturamento.renovacao_id)
        .first()

      if (!contratoItem || !contratoItem.renovacao_id) {
        throw new Error(
          `Item de contrato com ID ${contrato_item_id} não encontrado ou não associado à renovação do faturamento.`
        )
      }

      const novoItemFaturamento = await FaturamentoItens.create({
        faturamento_id: faturamento.id,
        contrato_item_id: contratoItem.id,
        titulo: contratoItem.titulo,
        unidade_medida: contratoItem.unidade_medida,
        valor_unitario: contratoItem.valor_unitario,
        saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
        quantidade_itens: quantidade_itens,
      })

      return response.status(201).json(novoItemFaturamento)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro ao adicionar item ao faturamento')
    }
  }

  async updateRenovacao({ params, request, response }: HttpContext) {
    const { data_inicio, data_fim, tipo_renovacao, porcentagem_renovacao } = request.only([
      'data_inicio',
      'data_fim',
      'tipo_renovacao',
      'porcentagem_renovacao',
    ])

    try {
      const renovacao = await Renovacao.find(params.renovacao_id)
      if (!renovacao) {
        return response.status(404).json({ message: 'Renovação não encontrada' })
      }

      if (data_inicio) renovacao.data_inicio = data_inicio
      if (data_fim) renovacao.data_fim = data_fim
      if (tipo_renovacao) renovacao.tipo_renovacao = tipo_renovacao
      if (porcentagem_renovacao) renovacao.porcentagem_renovacao = porcentagem_renovacao

      await renovacao.save()

      return response.status(200).json(renovacao)
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao atualizar renovação' })
    }
  }

  async updateRenovacaoItem({ params, request, response }: HttpContext) {
    const { titulo, unidade_medida, valor_unitario, saldo_quantidade_contratada } = request.only([
      'titulo',
      'unidade_medida',
      'valor_unitario',
      'saldo_quantidade_contratada',
    ])

    try {
      const contratoItem = await ContratoItem.find(params.id_item)
      if (!contratoItem || !contratoItem.renovacao_id) {
        return response.status(404).json({ message: 'Item da renovação não encontrado' })
      }

      if (titulo) contratoItem.titulo = titulo
      if (unidade_medida) contratoItem.unidade_medida = unidade_medida
      if (valor_unitario) contratoItem.valor_unitario = valor_unitario
      if (saldo_quantidade_contratada) {
        contratoItem.saldo_quantidade_contratada = saldo_quantidade_contratada
      }

      await contratoItem.save()

      return response.status(200).json(contratoItem)
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao atualizar item da renovação' })
    }
  }

  async getRenovacoesByContract({ params, response }: HttpContext) {
    try {
      const renovacoes = await Renovacao.query()
        .where('contrato_id', params.contrato_id)
        .preload('contratoItens')
        .preload('faturamentos', (query) => {
          query.preload('faturamentoItens')
        })

      return response.status(200).json(renovacoes)
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao listar renovações' })
    }
  }

  async getRenovacaoById({ params, response }: HttpContext) {
    try {
      const renovacao = await Renovacao.query()
        .where('id', params.renovacao_id)
        .preload('contratoItens')
        .preload('faturamentos', (query) => {
          query.preload('faturamentoItens')
        })
        .first()

      if (!renovacao) {
        return response.status(404).json({ message: 'Renovação não encontrada' })
      }

      return response.status(200).json(renovacao)
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao listar renovação' })
    }
  }

  async deleteRenovacaoItem({ params, response }: HttpContext) {
    try {
      const contratoItem = await ContratoItem.find(params.item_id)
      if (!contratoItem) {
        return response.status(404).json({ message: 'Item de renovação não encontrado' })
      }

      await contratoItem.delete()
      return response.status(200).json({ message: 'Item de renovação deletado com sucesso' })
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao deletar item de renovação' })
    }
  }

  async deleteRenovacao({ params, response }: HttpContext) {
    try {
      const renovacao = await Renovacao.find(params.renovacao_id)
      if (!renovacao) {
        return response.status(404).json({ message: 'Renovação não encontrada' })
      }

      await ContratoItem.query().where('renovacao_id', renovacao.id).delete()

      await renovacao.delete()

      return response.status(200).json({ message: 'Renovação deletada com sucesso' })
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao deletar renovação' })
    }
  }

  async deleteRenovacaoFaturamentoItem({ params, response }: HttpContext) {
    try {
      const faturamentoItem = await FaturamentoItens.find(params.id_item)
      if (!faturamentoItem) {
        return response.status(404).json({ message: 'Item do faturamento não encontrado' })
      }

      await faturamentoItem.delete()

      return response.status(200).json({ message: 'Item do faturamento deletado com sucesso' })
    } catch (err) {
      console.error(err)
      return response.status(500).json({ message: 'Erro ao deletar item do faturamento' })
    }
  }
}
