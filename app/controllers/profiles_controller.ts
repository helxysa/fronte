/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Profile from '#models/profile'

export default class ProfilesController {
  async index({ response }: HttpContext) {
    const profiles = await Profile.all()
    return response.json(profiles)
  }

  async store({ request, response }: HttpContext) {
    const { name, can_create, can_edit, can_view, can_delete } = request.only([
      'name',
      'can_create',
      'can_edit',
      'can_view',
      'can_delete',
    ])

    const profile = await Profile.create({
      name,
      can_create: can_create || false,
      can_edit: can_edit || false,
      can_view: can_view || false,
      can_delete: can_delete || false,
    })

    return response.status(201).json({
      message: 'Perfil criado com sucesso',
      profile,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const profileId = params.id
    const { name, can_create, can_edit, can_view, can_delete } = request.only([
      'name',
      'can_create',
      'can_edit',
      'can_view',
      'can_delete',
    ])

    const profile = await Profile.findOrFail(profileId)

    profile.merge({
      name,
      can_create: can_create || false,
      can_edit: can_edit || false,
      can_view: can_view || false,
      can_delete: can_delete || false,
    })

    await profile.save()

    return response.status(200).json({
      message: 'Perfil atualizado com sucesso',
      profile,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const profileId = params.id

    const profile = await Profile.findOrFail(profileId)

    await profile.delete()

    return response.status(200).json({
      message: 'Perfil deletado com sucesso',
    })
  }

  async show({ params }: HttpContext) {
    const profileId = params.id

    const profile = await Profile.findOrFail(profileId)

    return profile
  }
}
