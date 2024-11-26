import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import crypto from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import env from '#start/env'
import Profile from '#models/profile'

const DEFAULT_PASSWORD = 'Boss1234'

export default class UsersController {
  async index({ response }: HttpContext) {
    const users = await User.query().preload('profile')

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
    const user = await User.query()
      .where('id', params.id)
      .preload('profile', (profileQuery) => {
        profileQuery.preload('permissions', (permissionQuery) => {
          permissionQuery.select(['name', 'actions'])
        })
      })
      .first()

    if (!user) {
      return response.status(404).json('Não existe usuário.')
    }

    const filteredPermissions = user.profile.permissions.map((permission) => {
      return {
        name: permission.name,
        actions: permission.actions,
      }
    })

    return response.json({
      id: user.id,
      nome: user.nome,
      cargo: user.cargo,
      setor: user.setor,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      passwordExpiredAt: user.passwordExpiredAt,
      passwordResetToken: user.passwordResetToken,
      passwordChanged: user.passwordChanged,
      profile: {
        id: user.profile.id,
        name: user.profile.name,
        permissions: filteredPermissions,
      },
    })
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
            .from(env.get('SMTP_USERNAME'))
            // .from('monitoramento.msb@gmail.com')
            .subject('Senha Alterada com Sucesso')
            .text('Sua senha de primeiro acesso foi alterada com sucesso.')
        })
      } catch (error) {
        return response.status(500).json('Erro ao enviar e-mail de confirmação.')
      }

      return response.json({ message: 'Senha alterada com sucesso.' })
    }
    user.password = newPassword
    user.passwordChanged = true
    user.passwordExpiredAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    await user.save()

    try {
      await mail.send((message) => {
        message
          .to(user.email)
          .from(env.get('SMTP_USERNAME'))
          // .from('monitoramento.msb@gmail.com')
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
    let textoUrl = ''
    const user = await User.findBy('email', email)
    if (!user) {
      return response.status(404).json('E-mail não é válido.')
    }

    const token = crypto.randomBytes(20).toString('hex')
    user.passwordResetToken = token
    await user.save()

    if (process.env.NODE_ENV === 'development') {
      textoUrl = 'https://boss.msbtec.dev'
    } else {
      textoUrl = 'https://boss.msbtec.app'
    }

    await mail.send((message) => {
      message
        .to(user.email)
        .from(env.get('SMTP_USERNAME'))
        // .from('monitoramento.msb@gmail.com')
        .subject('Redefinição de Senha')
        .text(
          `Clique no link para redefinir sua senha: ${textoUrl}/esqueci-minha-senha?token=${token}`
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
    user.passwordChanged = true
    user.passwordResetToken = null
    await user.save()

    return response.json({ message: 'Senha alterada com sucesso.' })
  }

  async updatePasswordChangedStatus({ params, request, response }: HttpContext) {
    const { passwordChanged } = request.only(['passwordChanged'])

    if (typeof passwordChanged !== 'boolean') {
      return response
        .status(400)
        .json({ message: 'O campo passwordChanged deve ser um valor booleano.' })
    }

    try {
      const user = await User.find(params.id)

      if (!user) {
        return response.status(404).json({ message: 'Usuário não encontrado.' })
      }

      user.passwordChanged = passwordChanged
      await user.save()

      return response.json({
        message: 'Status atualizado com sucesso.',
        user,
      })
    } catch (error) {
      console.error('Erro ao atualizar o status:', error)
      return response.status(500).json({ message: 'Erro ao atualizar o status.' })
    }
  }

  async setUserProfile({ params, request, response }: HttpContext) {
    const userId = params.id
    const profileId = request.input('profile_id')

    const user = await User.findOrFail(userId)
    const profile = await Profile.findOrFail(profileId)

    user.profileId = profile.id
    await user.save()

    return response.status(200).json({
      message: 'Perfil associado ao usuário com sucesso',
      user,
    })
  }

  async updateUsuario({ params, request, response }: HttpContext) {
    try {
      const user = await User.find(params.id)

      if (!user) {
        return response.status(404).json({ message: 'Usuário não encontrado.' })
      }

      const { nome, cargo, setor, profileId, email } = request.only([
        'nome',
        'cargo',
        'setor',
        'profileId',
        'email',
      ])

      if (nome) {
        user.nome = nome
      }

      if (cargo) {
        user.cargo = cargo
      }

      if (setor) {
        user.setor = setor
      }

      if (profileId) {
        const profile = await Profile.find(profileId)
        if (!profile) {
          return response.status(404).json({ message: 'Perfil não encontrado.' })
        }
        user.profileId = profileId
      }

      if (email) {
        if (!email.includes('@')) {
          return response.status(400).json({ message: 'E-mail inválido.' })
        }
        const emailExists = await User.findBy('email', email)
        if (emailExists && emailExists.id !== user.id) {
          return response.status(400).json({ message: 'E-mail já está em uso por outro usuário.' })
        }
        user.email = email
      }

      await user.save()

      return response.json({ message: 'Usuário atualizado com sucesso.', user })
    } catch (error) {
      console.error('Erro ao atualizar o usuário:', error)
      return response.status(500).json({ message: 'Erro ao atualizar o usuário.' })
    }
  }
}
