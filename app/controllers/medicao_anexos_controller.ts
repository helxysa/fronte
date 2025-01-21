import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import MedicaoAnexo from '#models/medicao_anexo'
import fs from 'node:fs'

export default class MedicaoAnexosController {
  async store({ request, params, response }: HttpContext) {
    try {
      const lancamentoId = params.lancamento_id

      const files = request.files('file', {
        size: '20mb',
        // extnames: ['pdf', 'docx', 'doc', 'xlsx', 'csv', 'jpg', 'png', 'rar', 'zip'],
      })

      if (!files || files.length === 0) {
        return response.badRequest('Arquivo inválido ou não enviado.')
      }

      const anexos = []

      for (const file of files) {
        if (!file.isValid) {
          return response.badRequest(`Arquivo inválido: ${file.clientName}`)
        }

        const fileName = `${new Date().getTime()}-${file.clientName}`

        await file.move(app.publicPath('uploads/medicao'), {
          name: fileName,
        })

        const anexo = await MedicaoAnexo.create({
          lancamento_id: lancamentoId,
          file_name: file.clientName,
          file_path: `/uploads/medicao/${fileName}`,
          file_type: file.extname,
        })

        anexos.push(anexo)
      }

      return response.ok({ message: 'Anexo(s) adicionado(s) com sucesso!', anexos })
    } catch (error) {
      // trata o erro "request entity too large"
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
    const lancamentoId = params.lancamento_id
    const anexos = await MedicaoAnexo.query().where('lancamento_id', lancamentoId)
    let prefixUrl = ''

    if (process.env.NODE_ENV === 'development') {
      prefixUrl = 'https://api-boss.msbtec.dev'
    } else if (process.env.NODE_ENV === 'production') {
      prefixUrl = 'https://api-boss.msbtec.app'
    }

    const anexosComUrl = anexos.map((anexo) => ({
      ...anexo.toJSON(),
      file_url: `${prefixUrl}${anexo.file_path}`,
      // file_url: `http://localhost:3333${anexo.file_path}`,
    }))

    return response.ok({ anexos: anexosComUrl })
  }

  //Busca anexo específico pelo id
  async show({ params, response }: HttpContext) {
    try {
      const anexo = await MedicaoAnexo.findOrFail(params.id)
      return response.ok({ anexo })
    } catch (error) {
      return response.status(404).send({
        message: 'Anexo não encontrado.',
      })
    }
  }

  //Renomear arquivo
  async update({ request, params, response }: HttpContext) {
    try {
      const anexo = await MedicaoAnexo.findOrFail(params.id)

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

  //Excluir um anexo
  async destroy({ params, response }: HttpContext) {
    try {
      const anexo = await MedicaoAnexo.findOrFail(params.id)

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
}
