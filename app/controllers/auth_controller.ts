import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
// import env from '#start/env'
// import Database from '@adonisjs/lucid/services/db'

const DEFAULT_PASSWORD = 'Boss1234'
export default class AuthController {
  async register({ request, response }: HttpContext) {
    let textoUrl =
      process.env.NODE_ENV === 'development' ? 'https://boss.msbtec.dev' : 'https://boss.msbtec.app'

    try {
      const data = await request.validateUsing(registerValidator)
      const user = await User.create({
        ...data,
        password: DEFAULT_PASSWORD,
      })

      // Retorna a resposta imediatamente após a criação do usuário
      response.status(201).json({
        message: 'Usuário registrado com sucesso.',
        user,
      })

      // Enviar e-mail de forma assíncrona (não bloqueando a resposta)
      await mail
        .send((message) => {
          message
            .to(user.email)
            // .from(env.get('SMTP_USERNAME'))
            .from('monitoramento.msb@gmail.com')
            .subject('Acesso ao Sistema - Credenciais de Acesso').html(`
            <h1>Olá, ${user.nome}!</h1>
            <p>Sua conta foi criada com sucesso.</p>
            <p><strong>Senha Padrão:</strong> ${DEFAULT_PASSWORD}</p>
            <p><a href="${textoUrl}">Clique aqui</a> para acessar o sistema.</p>
            <p>Recomendamos alterar sua senha após o primeiro acesso.</p>
            <br />
            <p>Atenciosamente,</p>
            <p>Equipe Boss.</p>
          `)
        })
        .catch((error) => {
          console.error('Erro ao enviar e-mail:', error)
        })
    } catch (error) {
      console.log(error)
      return response.status(400).json({
        errors: [{ message: 'Erro ao registrar o usuário.' }],
      })
    }
  }

  async resetPasswordByAdministrator({ request, response }: HttpContext) {
    try {
      const { email } = request.only(['email'])

      const user = await User.findByOrFail('email', email)

      user.password = DEFAULT_PASSWORD
      user.passwordChanged = false

      await user.save()
      // await Database.from('auth_access_tokens')
      //   .where('tokenable_id', user.id)
      //   .andWhere('type', 'auth_token')
      //   .delete()

      // const deleteCount = await Database.from('auth_access_tokens')
      //   .where('tokenable_id', user.id)
      //   .andWhere('type', 'auth_token')
      //   .delete()

      // console.log(`Deleted ${deleteCount} tokens for user ID ${user.id}`)
      // console.log('', User.accessTokens)
      // console.log('database', await User.accessTokens.all(user))
      // await Database.from('auth_access_tokens').where('tokenable_id', user.id).delete()
      // await User.accessTokens.delete(user, user.id)
      // await Database.from('auth_access_tokens').where('user_id', user.id).delete()
      // const deleteCount = await Database.from('auth_access_tokens')
      //   .where('user_id', user.id)
      //   .delete()

      // console.log(`Deleted ${deleteCount} tokens for user ID ${user.id}`)
      // console.log(Database)

      const textoUrl =
        process.env.NODE_ENV === 'development'
          ? 'https://boss.msbtec.dev'
          : 'https://boss.msbtec.app'

      mail.send((message) => {
        message
          .to(user.email)
          // .from(env.get('SMTP_USERNAME'))
          .from('monitoramento.msb@gmail.com')
          .subject('Sua senha foi resetada - Acesso ao Sistema').html(`
            <h1>Olá, ${user.nome}!</h1>
            <p>Sua senha foi resetada para a senha padrão.</p>
            <p><strong>Senha Padrão:</strong> ${DEFAULT_PASSWORD}</p>
            <p><a href="${textoUrl}">Clique aqui</a> para acessar o sistema e fazer seu primeiro acesso novamente.</p>
            <p>Será necessário que você altere sua senha imediatamente após o acesso.</p>
            <br />
            <p>Atenciosamente,</p>
            <p>Equipe Boss.</p>
          `)
      })

      return response.status(200).json({
        message: 'Senha resetada com sucesso. Um e-mail foi enviado ao usuário.',
      })
    } catch (error) {
      console.error(error)
      return response.status(400).json({
        message: 'Erro ao resetar a senha. Verifique se o e-mail está correto.',
      })
    }
  }

  async login({ request, response }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator)
      const user = await User.query().where('email', email).first()

      if (!user) {
        return response.status(400).json({ message: 'E-mail inválido.' })
      }

      const isPasswordValid = await hash.verify(user.password, password)

      if (!isPasswordValid) {
        return response.status(400).json({ message: 'Senha inválida.' })
      }

      const token = await User.accessTokens.create(user)

      return response.status(200).json({
        message: 'Login realizado com sucesso.',
        user,
        token,
      })
    } catch (error) {
      return response.status(500).json({
        errors: [{ message: 'Erro ao realizar login.' }],
      })
    }
  }

  async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)

      return response.json({ message: 'Logout realizado com sucesso.' })
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao realizar logout.', error })
    }
  }

  async me({ auth }: HttpContext) {
    try {
      await auth.check()
      return {
        user: auth.user,
      }
    } catch (error) {
      return { message: 'Usuário não autenticado.' }
    }
  }

  static async verifyCredentials(email: string, password: string) {
    const user = await User.query().where('email', email).first()

    if (!user) {
      throw new Error('E-mail inválido.')
    }

    const isPasswordValid = await hash.verify(user.password, password)

    if (!isPasswordValid) {
      throw new Error('Senha inválida.')
    }

    return user
  }
}
