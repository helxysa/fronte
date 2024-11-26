import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import User from '#models/user'
import CurrentUserService from '#services/current_user_service'
/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    try {
      await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
      const user = ctx.auth.user as User
      const currentToken = ctx.auth.user?.currentAccessToken
      const tokenExpiryTime = currentToken?.expiresAt?.getTime()
      const currentTime = new Date().getTime()

      if (!tokenExpiryTime) {
        return ctx.response.unauthorized({
          message: 'Token inválido ou não possui data de expiração.',
        })
      }

      if (currentTime > tokenExpiryTime) {
        return ctx.response.unauthorized({
          message: 'Sua sessão expirou. Faça login novamente.',
        })
      }

      // Armazena as info do usuário no serviço para o registro de logs
      CurrentUserService.setCurrentUserId(user.id)
      CurrentUserService.setCurrentUsername(user.nome)

      return next()
    } catch (error) {
      console.error('Erro no AuthMiddleware:', error)

      return ctx.response.unauthorized({
        message: 'Você não está autenticado. Faça login para continuar.',
      })
    }
  }
}
