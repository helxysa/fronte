import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import crypto from 'node:crypto'
import hash from '@adonisjs/core/services/hash'

const DEFAULT_PASSWORD = 'Boss1234'

export default class UsersController {
  async index({ response }: HttpContext) {
    const users = await User.all()
    return response.json(users)
  }

  async store({ request, response }: HttpContext) {
    const data = request.only(['email', 'password'])

    if (data.password === 'Boss1234') {
      return response.status(400).json({ message: 'Você precisa definir uma nova senha.' })
    }

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

  async updateEmail({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).json('Usuário não encontrado.')
    }

    const { email } = request.only(['email'])

    if (!email || !email.includes('@')) {
      return response.status(400).json({ message: 'E-mail inválido.' })
    }

    user.email = email
    await user.save()

    return response.json({ message: 'E-mail atualizado com sucesso.', user })
  }

  async updatePassword({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.status(404).json('Usuário não encontrado.')
    }

    const { newPassword } = request.only(['newPassword'])

    if (await hash.verify(user.password, DEFAULT_PASSWORD)) {
      user.password = newPassword
      user.passwordChanged = true
      user.passwordExpiredAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      await user.save()

      try {
        await mail.send((message) => {
          message
            .to(user.email)
            .from('monitoramento.msb@gmail.com')
            .subject('Senha Alterada com Sucesso')
            .text('Sua senha de primeiro acesso foi alterada com sucesso.')
        })
      } catch (error) {
        return response.status(500).json('Erro ao enviar e-mail de confirmação.')
      }

      return response.json({ message: 'Senha alterada com sucesso.' })
    }
    user.password = newPassword
    user.passwordExpiredAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    await user.save()

    try {
      await mail.send((message) => {
        message
          .to(user.email)
          .from('monitoramento.msb@gmail.com')
          .subject('Senha Alterada com Sucesso')
          .text('Sua senha foi alterada com sucesso.')
      })
    } catch (error) {
      return response.status(500).json('Erro ao enviar e-mail de confirmação.')
    }

    return response.json({ message: 'Senha alterada com sucesso.' })
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.status(404).json({ error: 'Usuário não encontrado.' })
    await user?.delete()
    return response.status(202).json({ message: 'Usuário deletado com sucesso.' })
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.only(['email'])
    const user = await User.findBy('email', email)
    if (!user) {
      return response.status(404).json('E-mail não é válido.')
    }

    const token = crypto.randomBytes(20).toString('hex')
    user.passwordResetToken = token
    await user.save()

    await mail.send((message) => {
      message
        .to(user.email)
        .from('monitoramento.msb@gmail.com')
        .subject('Redefinição de Senha')
        .text(
          `Clique no link para redefinir sua senha: http://localhost:5173/esqueci-minha-senha?token=${token}`
        )
    })

    return response.json({ message: 'E-mail de redefinição de senha enviado.' })
  }

  async resetPassword({ request, response }: HttpContext) {
    const { token, newPassword } = request.only(['token', 'newPassword'])

    if (!newPassword || newPassword.length < 8) {
      return response
        .status(400)
        .json({ message: 'A nova senha deve ter pelo menos 8 caracteres.' })
    }

    const user = await User.findBy('passwordResetToken', token)

    if (!user) {
      return response.status(400).json('Token inválido.')
    }

    user.password = newPassword
    user.passwordResetToken = null
    await user.save()

    return response.json({ message: 'Senha alterada com sucesso.' })
  }

  async sendHelloWorldEmail({ response }: HttpContext) {
    try {
      await mail.send((message) => {
        message
          .to('siqueira.pedro1998@gmail.com')
          .from('monitoramento.msb@gmail.com')
          .subject('Hello World Email')
          .text('Hello, World!')
      })

      return response.status(200).send('E-mail enviado com sucesso!')
    } catch (error) {
      console.error(error)
      return response.status(500).send('Erro ao enviar e-mail')
    }
  }
}
