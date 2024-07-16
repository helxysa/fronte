/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Faturamentos from '#models/faturamentos'
import FaturamentoItens from '#models/faturamento_itens'
import ContratoItens from '#models/contrato_itens'

export default class FaturamentosController {
  async createFaturamento({ request, response, params }: HttpContext) {
    const { id } = params
    const { status, nota_fiscal, data_pagamento, itens } = request.only([
      'status',
      'itens',
      'nota_fiscal',
      'data_pagamento',
    ])

    try {
      const novoFaturamento = await Faturamentos.create({
        contrato_id: id,
        status,
        nota_fiscal: nota_fiscal,
        data_pagamento: data_pagamento,
      })

      const faturamentoComItens = await Promise.all(
        itens.map(async (item: { id_item: number; quantidade_itens: string }) => {
          const contratoItem = await ContratoItens.find(item.id_item)
          if (!contratoItem) {
            throw new Error(`Item de contrato com id ${item.id_item} não encontrado.`)
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

  async getFaturamentos({ response }: HttpContext) {
    try {
      const faturamentos = await Faturamentos.query()
        .whereNull('renovacao_id')
        .preload('faturamentoItens')
        .exec()
      return response.json(faturamentos)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async getFaturamentoById({ params, response }: HttpContext) {
    const { id } = params

    try {
      const faturamento = await Faturamentos.query()
        .where('id', id)
        .preload('faturamentoItens')
        .first()

      if (!faturamento) {
        return response.status(404).send('Faturamento não encontrado.')
      }

      return response.json(faturamento)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async updateFaturamento({ request, response, params }: HttpContext) {
    const { id } = params
    const { status, itens, nota_fiscal, data_pagamento } = request.only([
      'status',
      'itens',
      'nota_fiscal',
      'data_pagamento',
    ])

    try {
      const faturamento = await Faturamentos.find(id)

      if (!faturamento) {
        return response.status(404).send('Faturamento não encontrado.')
      }

      faturamento.status = status
      faturamento.nota_fiscal = nota_fiscal
      faturamento.data_pagamento = data_pagamento

      await faturamento.save()

      await Promise.all(
        itens.map(async (item: { id: number; quantidade_itens: string }) => {
          const faturamentoItem = await FaturamentoItens.find(item.id)

          if (faturamentoItem) {
            faturamentoItem.merge({
              quantidade_itens: item.quantidade_itens,
            })
            await faturamentoItem.save()
          }
        })
      )

      await faturamento.load('faturamentoItens')

      return response.status(200).json(faturamento)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async deleteFaturamento({ params, response }: HttpContext) {
    const { id } = params

    try {
      const faturamento = await Faturamentos.find(id)

      if (!faturamento) {
        return response.status(404).send('Faturamento não encontrado.')
      }

      await faturamento.delete()

      return response.status(200).send('Faturamento deletado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async deleteFaturamentoItem({ params, response }: HttpContext) {
    const { id, itemId } = params

    try {
      const faturamentoItem = await FaturamentoItens.query()
        .where('faturamento_id', id)
        .andWhere('id', itemId)
        .first()

      if (!faturamentoItem) {
        return response.status(404).send('item do faturamento não encontrado.')
      }

      await faturamentoItem.delete()

      return response.status(200).send('Item do faturamento deletado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async addFaturamentoItem({ request, response, params }: HttpContext) {
    const { id } = params
    const { contrato_item_id, quantidade_itens } = request.only([
      'contrato_item_id',
      'quantidade_itens',
    ])

    try {
      const faturamento = await Faturamentos.query().where('id', id).preload('contratos').first()

      if (!faturamento) {
        return response.status(404).send('Faturamento não encontrado')
      }

      const contratoItem = await ContratoItens.query()
        .where('id', contrato_item_id)
        .where('contrato_id', faturamento.contratos.id)
        .first()

      if (!contratoItem) {
        return response
          .status(404)
          .send('Item do contrato não encontrado ou não associado ao contrato do faturamento.')
      }

      const faturamentoItem = await FaturamentoItens.create({
        faturamento_id: faturamento.id,
        contrato_item_id: contratoItem.id,
        titulo: contratoItem.titulo,
        unidade_medida: contratoItem.unidade_medida,
        valor_unitario: contratoItem.valor_unitario,
        saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
        quantidade_itens: quantidade_itens,
      })

      return response.status(201).json(faturamentoItem)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }
}
