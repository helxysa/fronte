import app from '@adonisjs/core/services/app'
import ws from '#services/ws'

app.ready(() => {
  ws.boot()
  const io = ws.io
  io?.on('connection', (socket) => {
    // console.log('A new connection', socket.id)

    socket.on('medicao:update', (data) => {
      // console.log('Evento medicao:update recebido do cliente:', data)

      // Reemitir o evento para todos os clientes conectados
      io.emit('medicao:update', data)
    })
  })
})
