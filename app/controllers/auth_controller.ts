import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator)
      const user = await User.create({
        ...data,
        password: data.password,
      })
      return response.status(201).json({
        message: 'Usuário registrado com sucesso.',
        user,
      })
    } catch (error) {
      return response.status(400).json({
        errors: [{ message: 'Erro ao registrar o usuário.' }],
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
