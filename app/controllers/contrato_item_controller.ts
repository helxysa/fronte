/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import ContratoItens from '#models/contrato_itens'
import LancamentoItens from '#models/lancamento_itens'
import CurrentUserService from '#services/current_user_service'
import Logs from '#models/log'

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

      const contratoItens = await query.orderBy('created_at', 'desc').paginate(page, limit)

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

      // Verificar se o item de contrato está vinculado a alguma medição
      // const lancamentoItensCount = await LancamentoItens.query()
      //   .where('contrato_item_id', contratoItem.id)
      //   .count('* as total')

      // const totalItensVinculados = Number(lancamentoItensCount[0].$extras.total)
      // if (totalItensVinculados > 0) {
      //   return response.status(400).json({
      //     message: 'Este item do contrato está vinculado a uma medição e não pode ser editado.',
      //   })
      // }

      contratoItem.merge(data)
      await contratoItem.save()

      // Altera também os itens vinculados a lançamentos (medições)
      const lancamentoItens = await LancamentoItens.query().where(
        'contrato_item_id',
        contratoItem.id
      )

      for (const lancamentoItem of lancamentoItens) {
        lancamentoItem.merge({
          titulo: contratoItem.titulo,
          unidade_medida: contratoItem.unidade_medida,
          valor_unitario: contratoItem.valor_unitario,
          saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
        })
        await lancamentoItem.save()
      }

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

      const lancamentoItensCount = await LancamentoItens.query()
        .where('contrato_item_id', contratoItem.id)
        .count('* as total')

      const totalItensVinculados = Number(lancamentoItensCount[0].$extras.total)
      if (totalItensVinculados > 0) {
        return response.status(400).json({
          message: 'Este item do contrato está vinculado a uma medição e não pode ser excluído.',
        })
      }
      try {
        const userId = CurrentUserService.getCurrentUserId()
        const username = CurrentUserService.getCurrentUsername()
        const contrato = await contratoItem.related('contratos').query().first()
        if (!contrato) {
          return response
            .status(404)
            .json({ message: 'Contrato relacionado ao item não encontrado.' })
        }
        await Logs.create({
          userId: userId || 0,
          name: username || 'Usuário',
          action: 'Deletar',
          model: 'Itens',
          modelId: contratoItem.id,
          description: `${username} excluiu o item "${contratoItem.titulo}" do contrato "${contrato.nome_contrato}".`,
        })
      } catch (error) {
        console.error('Erro ao criar o log de exclusão:', error)
      }

      await contratoItem.delete()

      return response.status(200).json({ message: 'Item do contrato deletado com sucesso.' })
    } catch (error) {
      console.error(error)
      response.status(500).send('Server error')
    }
  }
}
