/* eslint-disable @typescript-eslint/naming-convention */
import { HttpContext } from '@adonisjs/core/http'
import UnidadeMedida from '#models/unidade_medida'

export default class UnidadeMedidaController {
  async index({ response }: HttpContext) {
    try {
      const unidadesMedida = await UnidadeMedida.query().orderBy('unidade_medida', 'asc')

      if (unidadesMedida.length <= 0) {
        return response.json({
          status: 'success',
          message: 'Não foi possível encontrar unidades de medidas cadastradas.',
        })
      }

      return response.json({
        status: 'success',
        data: unidadesMedida,
        message: 'Unidades de medida recuperadas com sucesso',
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Ocorreu um erro ao recuperar as unidades de medida',
        error: error.message,
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const { unidade_medida } = request.only(['unidade_medida'])

    const unidadeExistente = await UnidadeMedida.findBy('unidade_medida', unidade_medida)
    if (unidadeExistente) {
      return response.status(400).json({
        status: 'error',
        message: 'Já existe uma unidade de medida com esse nome.',
      })
    }
    const unidadeMedida = await UnidadeMedida.create({ unidade_medida })
    return response.status(201).json(unidadeMedida)
  }

  async show({ params, response }: HttpContext) {
    const unidadeMedida = await UnidadeMedida.findOrFail(params.id)
    return response.json(unidadeMedida)
  }

  async update({ params, request, response }: HttpContext) {
    const unidadeMedida = await UnidadeMedida.findOrFail(params.id)
    const { unidade_medida } = request.only(['unidade_medida'])

    const unidadeExistente = await UnidadeMedida.query()
      .where('unidade_medida', unidade_medida)
      .whereNot('id', params.id)
      .first()

    if (unidadeExistente) {
      return response.status(400).json({
        status: 'error',
        message: 'Já existe uma unidade de medida com esse nome.',
      })
    }

    unidadeMedida.merge({ unidade_medida })
    await unidadeMedida.save()
    return response.json({
      status: 'success',
      data: unidadeMedida,
      message: 'Unidade de medida atualizada com sucesso!',
    })
  }

  async destroy({ params, response }: HttpContext) {
    const unidadeMedida = await UnidadeMedida.findOrFail(params.id)
    await unidadeMedida.delete()
    return response.status(200).json({ message: 'Unidade de medida deletada com sucesso!' })
  }
}
