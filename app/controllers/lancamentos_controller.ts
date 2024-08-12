/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Lancamentos from '#models/lancamentos'
import LancamentoItens from '#models/lancamento_itens'
import ContratoItens from '#models/contrato_itens'
import { DateTime } from 'luxon'
import FaturamentoItem from '#models/faturamento_item'

export default class LancamentosController {
  async createLancamento({ request, response, params }: HttpContext) {
    const { id } = params
    const { status, projetos, data_pagamento, itens } = request.only([
      'status',
      'itens',
      'projetos',
      'data_pagamento',
    ])

    if (!projetos || !itens || !itens.length) {
      return response.status(400).send('nome do projeto e itens são obrigatórios.')
    }

    try {
      const novoLancamento = await Lancamentos.create({
        contrato_id: id,
        status,
        projetos: projetos,
        data_pagamento: data_pagamento,
      })

      const lancamentoComItens = await Promise.all(
        itens.map(async (item: { id_item: number; quantidade_itens: string; data: string }) => {
          const contratoItem = await ContratoItens.find(item.id_item)

          if (!item.id_item || !item.quantidade_itens || !item.data) {
            throw new Error('Cada item deve conter id do item, a quantidade de itens e data.')
          }

          if (!contratoItem) {
            throw new Error(`Item de contrato com id ${item.id_item} não encontrado.`)
          }

          const dataConvertida = parseDate(item.data)
          if (!dataConvertida) {
            throw new Error(`A data ${item.data} é inválida.`)
          }

          const novoItem = await LancamentoItens.create({
            lancamento_id: novoLancamento.id,
            contrato_item_id: contratoItem.id,
            titulo: contratoItem.titulo,
            unidade_medida: contratoItem.unidade_medida,
            valor_unitario: contratoItem.valor_unitario,
            saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
            quantidade_itens: item.quantidade_itens,
            data: dataConvertida,
          })
          return novoItem
        })
      )

      return response.status(201).json({
        ...novoLancamento.toJSON(),
        itens: lancamentoComItens,
      })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async getLancamentos({ response }: HttpContext) {
    try {
      const lancamentos = await Lancamentos.query()
        .whereNull('renovacao_id')
        .preload('lancamentoItens')
        .exec()
      return response.json(lancamentos)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async getLancamentoById({ params, response }: HttpContext) {
    const { id } = params

    try {
      const lancamento = await Lancamentos.query()
        .where('id', id)
        .preload('lancamentoItens')
        .first()

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      return response.json(lancamento)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async updateLancamento({ request, response, params }: HttpContext) {
    const { id } = params
    const { status, itens, projetos, data_pagamento } = request.only([
      'status',
      'itens',
      'projetos',
      'data_pagamento',
    ])

    try {
      const lancamento = await Lancamentos.find(id)

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      lancamento.status = status
      lancamento.projetos = projetos
      if (data_pagamento) {
        lancamento.data_pagamento = DateTime.fromFormat(data_pagamento, 'dd/MM/yyyy')
      }

      await lancamento.save()

      await Promise.all(
        itens.map(async (item: { id_item: number; quantidade_itens: string; data: string }) => {
          const lancamentoItem = await LancamentoItens.find(item.id_item)

          if (lancamentoItem) {
            lancamentoItem.merge({
              quantidade_itens: item.quantidade_itens,
              data: DateTime.fromISO(item.data).startOf('day'),
            })
            await lancamentoItem.save()
          }
        })
      )

      await lancamento.load('lancamentoItens')

      return response.status(200).json(lancamento)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async deleteLancamento({ params, response }: HttpContext) {
    const { id } = params

    try {
      const lancamento = await Lancamentos.find(id)

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      const relacionados = await FaturamentoItem.query()
        .where('lancamento_id', id)
        .count('* as total')

      const totalRelacionados = Number.parseInt(relacionados[0].$extras.total, 10) || 0

      if (totalRelacionados > 0) {
        return response.status(400).json({
          message:
            'Não foi possível deletar o lançamento, pois está vínculado com um ou mais faturamentos.',
        })
      }

      //soft delete nos itens relacionados ao lançamento
      await LancamentoItens.query()
        .where('lancamento_id', params.id)
        .update({ deletedAt: DateTime.local() })
      await lancamento.delete()

      return response.status(200).send('Lançamento deletado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async restoreLancamento({ params, response }: HttpContext) {
    const { id } = params

    try {
      const lancamento: any = await Lancamentos.withTrashed().where('id', id).firstOrFail()

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      //soft delete nos itens relacionados ao lançamento
      await LancamentoItens.query().where('lancamento_id', params.id).update({ deletedAt: null })
      await lancamento.restore()

      return response.status(200).send('Lançamento restaurado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async deleteLancamentoItem({ params, response }: HttpContext) {
    const { id, itemId } = params

    try {
      const lancamentoItem = await LancamentoItens.query()
        .where('lancamento_id', id)
        .andWhere('id', itemId)
        .first()

      if (!lancamentoItem) {
        return response.status(404).send('item do lancamento não encontrado.')
      }

      await lancamentoItem.delete()

      return response.status(200).send('Item do lancamento deletado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async addLancamentoItem({ request, response, params }: HttpContext) {
    const { id } = params
    const { contrato_item_id, quantidade_itens, data } = request.only([
      'contrato_item_id',
      'quantidade_itens',
      'data',
    ])

    try {
      const lancamento = await Lancamentos.query().where('id', id).preload('contratos').first()

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado')
      }

      const contratoItem = await ContratoItens.query()
        .where('id', contrato_item_id)
        .where('contrato_id', lancamento.contratos.id)
        .first()

      if (!contratoItem) {
        return response
          .status(404)
          .send('Item do contrato não encontrado ou não associado ao contrato do lançamento.')
      }

      const lancamentoItem = await LancamentoItens.create({
        lancamento_id: lancamento.id,
        contrato_item_id: contratoItem.id,
        titulo: contratoItem.titulo,
        unidade_medida: contratoItem.unidade_medida,
        valor_unitario: contratoItem.valor_unitario,
        saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
        quantidade_itens: quantidade_itens,
        data: data,
      })

      return response.status(201).json(lancamentoItem)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }
}

function parseDate(dateString: string): DateTime | null {
  const formats = ['dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MM-dd', 'dd-MM-yyyy']

  for (const format of formats) {
    const date = DateTime.fromFormat(dateString, format)
    if (date.isValid) {
      return date.startOf('day')
    }
  }
  return null
}
