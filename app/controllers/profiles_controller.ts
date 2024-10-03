/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Profile from '#models/profile'
import Permission from '#models/permission'

export default class ProfilesController {
  async index({ response }: HttpContext) {
    const profiles = await Profile.query().preload('permissions')
    return response.json(profiles)
  }

  async show({ params, response }: HttpContext) {
    const profileId = params.id

    const profile = await Profile.query()
      .where('id', profileId)
      .preload('permissions', (permissionQuery) => {
        permissionQuery.select(['name', 'can_create', 'can_edit', 'can_view', 'can_delete'])
      })
      .first()

    if (!profile) {
      return response.status(404).json({ message: 'Perfil não encontrado.' })
    }

    return response.json({
      id: profile.id,
      name: profile.name,
      permissions: profile.permissions.map((permission) => ({
        name: permission.name,
        canCreate: permission.can_create,
        canEdit: permission.can_edit,
        canView: permission.can_view,
        canDelete: permission.can_delete,
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
        can_create: perm.can_create || false,
        can_edit: perm.can_edit || false,
        can_view: perm.can_view || false,
        can_delete: perm.can_delete || false,
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
        can_create: perm.can_create || false,
        can_edit: perm.can_edit || false,
        can_view: perm.can_view || false,
        can_delete: perm.can_delete || false,
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

    return response.status(200).json({
      message: 'Perfil excluído com sucesso',
    })
  }
}
