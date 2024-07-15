import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
// import env from '#start/env'
export default class UsersController {
  async index({ response }: HttpContext) {
    const users = await User.all()
    return response.json(users)
  }

  async store({ request, response }: HttpContext) {
    const data = request.only(['email', 'password'])

    const user = await User.create(data)
    return response.status(201).json(user)
  }

  async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json('Não existe usuário.')
    }

    // if (!user.file) {
    //   user.file = 'default_avatar.png'
    // }

    // return response.json({ ...user.toJSON(), avatar_url: `${env.get('URL_FILE')}/${user.file}` })
    return response.json(user)
  }

  async update({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    // const file = request.file('file')
    const data = request.only(['email', 'password'])

    // if (file) {
    //   const fileName = `${cuid()}.${file.extname}`

    //   await file.move(Application.tmpPath('uploads'), {
    //     name: fileName,
    //     overwrite: true,
    //   })

    //   const fileSaved = await File.create({ file: fileName })

    //   fileSaved.save()
    //   user?.merge({ ...data, avatar_id: fileSaved.id })
    //   await user?.save()
    //   return response.json(user)
    // }
    user?.merge(data)
    await user?.save()
    return response.json(user)
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.status(404).json({ error: 'Usuário não encontrado.' })
    await user?.delete()
    return response.status(202).json({ message: 'Usuário deletado com sucesso.' })
  }
}
