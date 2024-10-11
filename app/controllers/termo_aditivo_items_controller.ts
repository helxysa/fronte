import type { HttpContext } from '@adonisjs/core/http'
import TermoAditivoItem from '#models/termo_aditivo_item'
import TermoAditivo from '#models/termo_aditivo'

export default class TermoAditivoItemsController {
  async store({ request, response }: HttpContext) {
    const termoAditivoItemData = request.only([
      'termo_aditivo_id',
      'titulo',
      'unidade_medida',
      'valor_unitario',
      'quantidade_contratada',
    ])

    try {
      await TermoAditivo.findOrFail(termoAditivoItemData.termo_aditivo_id)

      const termoAditivoItem = await TermoAditivoItem.create(termoAditivoItemData)

      return response.created(termoAditivoItem)
    } catch (error) {
      return response.status(400).json({ message: 'Erro ao criar item do termo aditivo', error })
    }
  }

  async show({ request, params, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = 10

      const termoAditivoItems = await TermoAditivoItem.query()
        .where('termo_aditivo_id', params.id)
        .paginate(page, limit)

      return response.json(termoAditivoItems)
    } catch (error) {
      return response.status(404).json({ message: 'Item do termo aditivo não encontrado', error })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const termoAditivoItemData = request.only([
      'titulo',
      'unidade_medida',
      'valor_unitario',
      'quantidade_contratada',
    ])

    try {
      const termoAditivoItem = await TermoAditivoItem.findOrFail(params.id)

      termoAditivoItem.merge(termoAditivoItemData)
      await termoAditivoItem.save()

      return termoAditivoItem
    } catch (error) {
      return response
        .status(400)
        .json({ message: 'Erro ao atualizar item do termo aditivo', error })
    }
  }
  async delete({ params, response }: HttpContext) {
    try {
      const termoAditivoItem = await TermoAditivoItem.findOrFail(params.id)

      await termoAditivoItem.delete()

      return response.json({ message: 'Item do termo aditivo deletado com sucesso' })
    } catch (error) {
      return response.status(400).json({ message: 'Erro ao deletar item do termo aditivo', error })
    }
  }
}
