import type { HttpContext } from '@adonisjs/core/http'
import Logs from '#models/log'

export default class LogsController {
  async index({ response }: HttpContext) {
    const logs = await Logs.query()
    return response.json(logs)
  }
}
