import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import TermoAditivoAnexo from '#models/termo_aditivo_anexo'
import TermoAditivo from '#models/termo_aditivo'
import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

export default class TermoAditivoAnexosController {
  getPrefixUrl() {
    if (process.env.NODE_ENV === 'development') {
      return 'https://api-boss.msbtec.dev'
    } else if (process.env.NODE_ENV === 'production') {
      return 'https://api-boss.msbtec.app'
    }
    return 'http://localhost:3333'
  }
  getFrontEndOrigin() {
    if (process.env.NODE_ENV === 'development') {
      return 'https://boss.msbtec.dev'
    } else if (process.env.NODE_ENV === 'production') {
      return 'https://boss.msbtec.app'
    }
    return 'http://localhost:5173'
  }

  async store({ request, params, response }: HttpContext) {
    try {
      const termoAditivoId = params.termo_aditivo_id

      const file = request.file('file', {
        size: '20mb',
        extnames: ['pdf', 'docx', 'doc', 'xlsx', 'csv', 'jpg', 'png', 'rar', 'zip'],
      })

      if (!file || !file.isValid) {
        return response.badRequest('Arquivo inválido ou não enviado.')
      }

      const fileName = `${new Date().getTime()}.${file.extname}`

      await file.move(app.publicPath('uploads/aditivo'), {
        name: fileName,
      })

      const anexo = await TermoAditivoAnexo.create({
        termo_aditivo_id: termoAditivoId,
        file_name: file.clientName,
        file_path: `/uploads/aditivo/${fileName}`,
        file_type: file.extname,
      })

      return response.ok({ message: 'Anexo adicionado com sucesso!', anexo })
    } catch (error) {
      // Captura o erro "request entity too large"
      if (error.status === 413) {
        return response.status(413).send({
          message: 'O arquivo enviado é muito grande. O tamanho máximo permitido é 20 MB.',
        })
      }

      return response.status(500).send({
        message: 'Erro no servidor ao tentar adicionar o anexo.',
        details: error.message,
      })
    }
  }

  async index({ params, response }: HttpContext) {
    try {
      const termoAditivoId = params.termo_aditivo_id

      const termoAditivo = await TermoAditivo.query()
        .where('id', termoAditivoId)
        .preload('contrato', (contratoQuery) => {
          contratoQuery.preload('contratoAnexo')
        })
        .preload('termoAditivoItem')
        .firstOrFail()

      const contratoAnexos = termoAditivo.contrato?.contratoAnexo || []
      const termoAditivoAnexos = await TermoAditivoAnexo.query().where(
        'termo_aditivo_id',
        termoAditivoId
      )

      const resposta = {
        termoAditivoId: termoAditivo.id,
        contratoId: termoAditivo.contrato_id,
        contratoAnexos: contratoAnexos.map((anexo) => ({
          id: anexo.id,
          fileName: anexo.file_name,
          filePath: anexo.file_path,
          fileType: anexo.file_type,
          fileUrl: `${this.getPrefixUrl()}${anexo.file_path}`,
        })),
        termoAditivoAnexos: termoAditivoAnexos.map((anexo) => ({
          id: anexo.id,
          fileName: anexo.file_name,
          filePath: anexo.file_path,
          fileType: anexo.file_type,
          fileUrl: `${this.getPrefixUrl()}${anexo.file_path}`,
        })),
      }

      return response.ok(resposta)
    } catch (error) {
      return response.status(404).json({
        message: 'Anexos não encontrados.',
        details: error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const anexo = await TermoAditivoAnexo.findOrFail(params.id)
      return response.ok({ anexo })
    } catch (error) {
      return response.status(404).send({
        message: 'Anexo não encontrado.',
      })
    }
  }

  async update({ request, params, response }: HttpContext) {
    try {
      const anexo = await TermoAditivoAnexo.findOrFail(params.id)

      const newFileName = request.input('file_name')

      if (newFileName) {
        anexo.file_name = newFileName
      } else {
        return response.badRequest({ message: 'Nome do arquivo não fornecido.' })
      }

      await anexo.save()

      return response.ok({ message: 'Nome do anexo atualizado com sucesso!', anexo })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao tentar atualizar o nome do anexo.',
        details: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const anexo = await TermoAditivoAnexo.findOrFail(params.id)

      const filePath = app.publicPath(anexo.file_path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      await anexo.delete()

      return response.ok({ message: 'Anexo excluído com sucesso!' })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao tentar excluir o anexo.',
        details: error.message,
      })
    }
  }

  async downloadZip({ params, response }: HttpContext) {
    try {
      const termoAditivoId = params.termo_aditivo_id

      // Buscar o termo aditivo e os anexos
      const termoAditivo = await TermoAditivo.query()
        .where('id', termoAditivoId)
        .preload('contrato', (contratoQuery) => {
          contratoQuery.preload('contratoAnexo')
        })
        .firstOrFail()

      const contratoAnexos = termoAditivo.contrato?.contratoAnexo || []
      const termoAditivoAnexos = await TermoAditivoAnexo.query().where(
        'termo_aditivo_id',
        termoAditivoId
      )

      // Obter o nome do termo aditivo
      const nomeTermoAditivo = termoAditivo.nome_termo || 'termo_aditivo'

      // Ajustar o nome do arquivo
      const nomeArquivo = `${nomeTermoAditivo.trim().replace(/\s+/g, '_')}.zip`
      const nomeArquivoCodificado = encodeURIComponent(nomeArquivo)

      const frontEndOrigin = this.getFrontEndOrigin()

      const headers = {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename*=UTF-8''${nomeArquivoCodificado}`,
        'Access-Control-Allow-Origin': frontEndOrigin, // Importante adicionar esta origem para evitar o erro de CORS
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Expose-Headers': 'Content-Disposition',
      }

      // Enviar os cabeçalhos antes de iniciar o streaming
      response.response.writeHead(200, headers)

      // Criar o arquivo ZIP
      const archive = archiver('zip', { zlib: { level: 9 } })

      // Conectar o stream de resposta diretamente ao ZIP
      archive.pipe(response.response)

      // Adicionar arquivos ao ZIP
      contratoAnexos.forEach((anexo) => {
        const filePath = path.join(process.cwd(), 'public', anexo.file_path)
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `contrato/${anexo.file_name}` })
        }
      })

      termoAditivoAnexos.forEach((anexo) => {
        const filePath = path.join(process.cwd(), 'public', anexo.file_path)
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `termo_aditivo/${anexo.file_name}` })
        }
      })

      await archive.finalize()
    } catch (error) {
      console.error('Erro ao gerar ZIP:', error)
      return response.status(500).json({
        message: 'Erro ao gerar o arquivo ZIP.',
        details: error.message,
      })
    }
  }
}
