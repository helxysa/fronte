import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
class Ws {
  io: Server | undefined
  private booted = false

  boot() {
    /**
     * Ignore multiple calls to the boot method
     */
    if (this.booted) {
      return
    }

    this.booted = true
    this.io = new Server(server.getNodeServer(), {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    })
  }
}

export default new Ws()
