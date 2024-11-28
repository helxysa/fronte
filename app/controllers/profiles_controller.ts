/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Profile from '#models/profile'
import Permission from '#models/permission'
import CurrentUserService from '#services/current_user_service'
import Logs from '#models/log'

export default class ProfilesController {
  async index({ response }: HttpContext) {
    const profiles = await Profile.query().preload('permissions')
    return response.json(profiles)
  }

  async show({ params, response }: HttpContext) {
    const profileId = params.id

    const profile = await Profile.query().where('id', profileId).preload('permissions').first()

    if (!profile) {
      return response.status(404).json({ message: 'Perfil não encontrado.' })
    }

    return response.json({
      id: profile.id,
      name: profile.name,
      permissions: profile.permissions.map((permission) => ({
        name: permission.name,
        actions: permission.actions,
      })),
    })
  }

  async store({ request, response }: HttpContext) {
    const { name, permissions } = request.only(['name', 'permissions'])

    const profile = await Profile.create({ name })

    for (const perm of permissions) {
      await Permission.create({
        profileId: profile.id,
        name: perm.name,
        actions: perm.actions || {},
      })
    }

    return response.status(201).json({
      message: 'Perfil e permissões criados com sucesso',
      profile,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const profileId = params.id
    const { name, permissions } = request.only(['name', 'permissions'])

    const profile = await Profile.findOrFail(profileId)
    profile.name = name
    await profile.save()

    await Permission.query().where('profile_id', profileId).delete()

    for (const perm of permissions) {
      await Permission.create({
        profileId: profile.id,
        name: perm.name,
        actions: perm.actions || {},
      })
    }

    return response.status(200).json({
      message: 'Perfil e permissões atualizados com sucesso',
      profile,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const profileId = params.id

    const profile = await Profile.findOrFail(profileId)
    await profile.delete()

    const userId = CurrentUserService.getCurrentUserId()
    const username = CurrentUserService.getCurrentUsername()

    await Logs.create({
      userId: userId || 0,
      name: username || 'Usuário',
      action: 'Deletar',
      model: 'Profile',
      modelId: profile.id,
      description: `${username} excluiu o perfil "${profile.name}" com ID ${profile.id}.`,
    })

    return response.status(200).json({
      message: 'Perfil excluído com sucesso',
    })
  }
}
