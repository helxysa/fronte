/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import ContratoItens from '#models/contrato_itens'

export default class ContratoItemController {
  async createContractItem({ request, response, params }: HttpContext) {
    const { id } = params
    const { titulo, unidade_medida, valor_unitario, saldo_quantidade_contratada } = request.only([
      'titulo',
      'unidade_medida',
      'valor_unitario',
      'saldo_quantidade_contratada',
    ])

    try {
      const contratoItem = await ContratoItens.create({
        contrato_id: id,
        titulo: titulo,
        unidade_medida: unidade_medida,
        valor_unitario: valor_unitario,
        saldo_quantidade_contratada: saldo_quantidade_contratada,
      })

      return response.status(201).json(contratoItem)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  async getContractItem({ response }: HttpContext) {
    try {
      const contratoItens = await ContratoItens.all()

      return response.json(contratoItens)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  async getContractItemByContract({ params, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const search = request.input('search')

    try {
      let query = ContratoItens.query().where('contrato_id', params.id)

      if (search) {
        query = query.whereILike('titulo', `%${search}%`)
      }

      const contratoItens = await query.paginate(page, limit)

      if (contratoItens.total === 0) {
        return response.status(404).json({ message: 'Nenhum item encontrado' })
      }

      return response.json(contratoItens)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Erro no servidor' })
    }
  }

  async updateContractItem({ request, response, params }: HttpContext) {
    const { itemId } = params
    const data = request.only([
      'titulo',
      'unidade_medida',
      'valor_unitario',
      'saldo_quantidade_contratada',
    ])

    try {
      const contratoItem = await ContratoItens.find(itemId)

      if (!contratoItem) {
        return response.status(404).send('Item do contrato não encontrado.')
      }

      contratoItem.merge(data)
      await contratoItem.save()

      return response.status(200).json(contratoItem)
    } catch (error) {
      console.error(error)
      response.status(500).send('Server error')
    }
  }
  async deleteContractItem({ params, response }: HttpContext) {
    const { itemId } = params

    try {
      const contratoItem = await ContratoItens.find(itemId)

      if (!contratoItem) {
        return response.status(404).json({ message: 'Item do contrato não encontrado.' })
      }
      await contratoItem.delete()

      return response.status(200).json({ message: 'Item do contrato deletado com sucesso.' })
    } catch (error) {
      console.error(error)
      response.status(500).send('Server error')
    }
  }
}
