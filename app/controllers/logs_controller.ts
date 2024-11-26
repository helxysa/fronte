import type { HttpContext } from '@adonisjs/core/http'
import Logs from '#models/log'

export default class LogsController {
  async index({ response, request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const logs = await Logs.query().orderBy('created_at', 'desc').paginate(page, limit)
    return response.json(logs)
  }
}
