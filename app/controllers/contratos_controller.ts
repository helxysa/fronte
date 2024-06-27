/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Contrato from '#models/contratos'
import ContratoItem from '#models/contrato_itens'

export default class ContratosController {
  async createContract({ request, response }: HttpContext) {
    const {
      nome_cliente,
      vigencia,
      saldo_contrato,
      fiscal,
      ponto_focal,
      cidade,
      objeto_contrato,
      items,
    } = request.only([
      'nome_cliente',
      'vigencia',
      'saldo_contrato',
      'fiscal',
      'ponto_focal',
      'cidade',
      'objeto_contrato',
      'items',
    ])

    try {
      const novoContrato = await Contrato.create({
        nome_cliente: nome_cliente,
        vigencia,
        saldo_contrato: saldo_contrato,
        fiscal,
        ponto_focal: ponto_focal,
        cidade,
        objeto_contrato: objeto_contrato,
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
      const contratos = await Contrato.query()
        .preload('contratoItens')
        .preload('faturamentos', (query) => {
          query.preload('faturamentoItens')
        })
        .exec()

      return response.json(contratos)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  async getContractById({ params, response }: HttpContext) {
    try {
      const contrato = await Contrato.query()
        .preload('contratoItens')
        .preload('faturamentos', (query) => {
          query.preload('faturamentoItens')
        })
        .where('id', params.id)
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
        nome_cliente,
        vigencia,
        saldo_contrato,
        fiscal,
        ponto_focal,
        cidade,
        objeto_contrato,
        items,
      } = request.only([
        'nome_cliente',
        'vigencia',
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

      contrato.nome_cliente = nome_cliente
      contrato.vigencia = vigencia
      contrato.saldo_contrato = saldo_contrato
      contrato.fiscal = fiscal
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
      const contrato = await Contrato.find(params.id)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      await contrato?.delete()

      return response.status(202).json({ message: 'Contrato deletado com sucesso.' })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }
}
