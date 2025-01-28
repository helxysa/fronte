import type { HttpContext } from '@adonisjs/core/http'
import TermoAditivoItem from '#models/termo_aditivo_item'
import TermoAditivo from '#models/termo_aditivo'

export default class TermoAditivosController {
  async index({ params, response }: HttpContext) {
    try {
      const contratoId = params.contrato_id

      const termoAditivos = await TermoAditivo.query()
        .where('contrato_id', contratoId)
        .preload('termoAditivoItem')
        .preload('contrato', (contratoQuery) => {
          contratoQuery
            .select(['nome_cliente', 'fiscal', 'ponto_focal', 'cidade', 'estado'])
            .preload('projetos', (query) => {
              query.whereNull('deleted_at')
            })
        })

      return response.json(termoAditivos)
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao listar termos aditivos', error })
    }
  }

  async store({ request, response }: HttpContext) {
    const termoAditivoData = request.only([
      'contrato_id',
      'nome_termo',
      'data_inicio',
      'data_fim',
      'saldo_contrato',
      'objeto_contrato',
    ])

    const itens = request.input('termo_aditivo_itens', [])

    try {
      const termoAditivo = await TermoAditivo.create(termoAditivoData)

      if (itens.length > 0) {
        await Promise.all(
          itens.map(async (item: any) => {
            await TermoAditivoItem.create({
              ...item,
              termo_aditivo_id: termoAditivo.id,
            })
          })
        )
      }

      await termoAditivo.load('termoAditivoItem')

      return response.created(termoAditivo)
    } catch (error) {
      return response.status(400).json({ message: 'Erro ao criar termo aditivo', error })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const termoAditivo = await TermoAditivo.query()
        .where('id', params.id)
        .preload('termoAditivoItem')
        .preload('contrato', (contratoQuery) => {
          contratoQuery
            .select(['nome_cliente', 'fiscal', 'ponto_focal', 'cidade', 'estado'])
            .preload('projetos', (query) => {
              query.whereNull('deleted_at')
            })
        })
        .firstOrFail()

      return termoAditivo
    } catch (error) {
      return response.status(404).json({ message: 'Termo Aditivo não encontrado', error })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const termoAditivoData = request.only([
      'nome_termo',
      'data_inicio',
      'data_fim',
      'saldo_contrato',
      'objeto_contrato',
    ])

    try {
      const termoAditivo = await TermoAditivo.findOrFail(params.id)

      termoAditivo.merge(termoAditivoData)
      await termoAditivo.save()

      return termoAditivo
    } catch (error) {
      return response.status(400).json({ message: 'Erro ao atualizar termo aditivo', error })
    }
  }

  async delete({ params, response }: HttpContext) {
    try {
      const termoAditivo = await TermoAditivo.findOrFail(params.id)

      await TermoAditivoItem.query().where('termo_aditivo_id', termoAditivo.id).delete()

      await termoAditivo.delete()

      return response.json({ message: 'Termo Aditivo deletado com sucesso' })
    } catch (error) {
      return response.status(400).json({ message: 'Erro ao deletar termo aditivo', error })
    }
  }
}
