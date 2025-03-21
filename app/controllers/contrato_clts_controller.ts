import type { HttpContext } from '@adonisjs/core/http'
import Contratoclt from '#models/contratoclt'
import { DateTime } from 'luxon'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'

export default class ContratoCltsController {
  async index({ response }: HttpContext) {
    try {
      const contratos = await Contratoclt.all()
      return response.ok(contratos)
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao buscar contratos CLT',
        details: error.message,
      })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      // Validar dados obrigatórios
      const dados: { [key: string]: any } = request.only([
        'matricula',
        'nomeCompleto',
        'cpf',
        'rg',
        'pis',
        'dataNascimento',
        'enderecoCompleto',
        'telefone',
        'emailPessoal',
        'dataAdmissao',
        'cargo',
        'nivelProfissional',
        'departamento',
        'projetoAtual',
        'gestorProjeto',
        'regimeTrabalho',
        'horarioTrabalho',
        'jornadaSemanal',
        'remuneracao',
        'formaPagamento',
        'chavePix',
        'banco',
        'agencia',
        'numeroConta',
        'planoSaude',
        'empresaPlanoSaude',
        'valeTransporte',
        'valorValeTransporte',
        'valeAlimentacao',
        'valorValeAlimentacao',
        'outrosBeneficios',
        'observacao',
      ])

      // Validar campos obrigatórios
      const camposObrigatorios = [
        'matricula',
        'nomeCompleto',
        'cpf',
        'rg',
        'pis',
        'dataNascimento',
        'enderecoCompleto',
        'telefone',
        'emailPessoal',
        'dataAdmissao',
        'cargo',
        'nivelProfissional',
        'departamento',
        'jornadaSemanal',
        'remuneracao',
      ]

      const camposFaltantes = camposObrigatorios.filter((campo) => !dados[campo])

      if (camposFaltantes.length > 0) {
        return response.status(400).json({
          message: 'Campos obrigatórios não preenchidos',
          campos: camposFaltantes,
        })
      }

      let documentosPath = ''
      const files = request.files('documentos')

      if (files && files.length > 0) {
        const documentosNomes = []

        // Criar diretório se não existir
        const uploadPath = app.tmpPath('uploads/contrato_clt')
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true })
        }

        for (let file of files) {
          if (!file.isValid) {
            return response.status(400).json({
              message: 'Arquivo inválido',
              erro: file.errors,
              arquivo: file.clientName,
            })
          }

          try {
            const fileName = `${new Date().getTime()}-${file.clientName}`
            await file.move(uploadPath, {
              name: fileName,
              overwrite: true,
            })
            documentosNomes.push(`/uploads/contrato_clt/${fileName}`)
          } catch (error) {
            console.error('Erro ao salvar arquivo:', error)
            return response.status(500).json({
              message: 'Erro ao salvar arquivo',
              erro: error.message,
              arquivo: file.clientName,
            })
          }
        }

        documentosPath = documentosNomes.join(',')
      }

      try {
        const contrato = await Contratoclt.create({
          ...dados,
          dataNascimento: DateTime.fromISO(dados.dataNascimento),
          dataAdmissao: DateTime.fromISO(dados.dataAdmissao),
          documentos: documentosPath || null,
        })

        return response.created({
          message: 'Contrato CLT criado com sucesso',
          contrato,
        })
      } catch (error) {
        console.error('Erro ao criar contrato:', error)
        return response.status(500).json({
          message: 'Erro ao criar contrato no banco de dados',
          erro: error.message,
        })
      }
    } catch (error) {
      console.error('Erro interno:', error)
      return response.status(500).json({
        message: 'Erro interno do servidor',
        erro: error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)
      return response.ok(contrato)
    } catch (error) {
      return response.status(404).send({
        message: 'Contrato CLT não encontrado',
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)
      const dados: { [key: string]: any } = request.only([
        'matricula',
        'nomeCompleto',
        'cpf',
        'rg',
        'pis',
        'dataNascimento',
        'enderecoCompleto',
        'telefone',
        'emailPessoal',
        'dataAdmissao',
        'cargo',
        'nivelProfissional',
        'departamento',
        'projetoAtual',
        'gestorProjeto',
        'regimeTrabalho',
        'horarioTrabalho',
        'jornadaSemanal',
        'remuneracao',
        'formaPagamento',
        'chavePix',
        'banco',
        'agencia',
        'numeroConta',
        'planoSaude',
        'empresaPlanoSaude',
        'valeTransporte',
        'valorValeTransporte',
        'valeAlimentacao',
        'valorValeAlimentacao',
        'outrosBeneficios',
        'observacao',
      ])

      const files = request.files('documentos', {
        size: '20mb',
        extnames: ['pdf', 'docx', 'doc', 'xlsx', 'csv', 'jpg', 'png', 'rar', 'zip'],
      })

      let documentosPath = contrato.documentos || '' // Inicializa com documentos existentes

      if (files && files.length > 0) {
        const documentosNomes = []
        const uploadPath = app.tmpPath('uploads/contrato_clt')

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true })
        }

        for (const file of files) {
          if (!file.isValid) {
            return response.badRequest(`Arquivo inválido: ${file.clientName}`)
          }

          const fileName = `${new Date().getTime()}-${file.clientName}`
          await file.move(app.tmpPath('uploads/contrato_clt'), {
            name: fileName,
          })
          documentosNomes.push(`/uploads/contrato_clt/${fileName}`)
        }

        // Concatena novos documentos com os existentes
        documentosPath = documentosPath
          ? `${documentosPath},${documentosNomes.join(',')}`
          : documentosNomes.join(',')
      }

      if (dados.dataNascimento) {
        dados.dataNascimento = DateTime.fromISO(dados.dataNascimento)
      }
      if (dados.dataAdmissao) {
        dados.dataAdmissao = DateTime.fromISO(dados.dataAdmissao)
      }

      await contrato
        .merge({
          ...dados,
          documentos: documentosPath,
        })
        .save()

      return response.ok({ message: 'Contrato CLT atualizado com sucesso', contrato })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao atualizar contrato CLT',
        details: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)

      if (contrato.documentos) {
        const documentos = contrato.documentos.split(',')
        for (const doc of documentos) {
          const filePath = app.tmpPath(doc)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        }
      }

      await contrato.delete()

      return response.ok({ message: 'Contrato CLT excluído com sucesso' })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao excluir contrato CLT',
        details: error.message,
      })
    }
  }

  async getDocumentos({ params, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)

      if (!contrato.documentos) {
        return response.ok({ documentos: [] })
      }

      return response.ok({
        documentos: contrato.documentos,
      })
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
      return response.status(500).send({
        message: 'Erro ao buscar documentos do contrato',
        details: error.message,
      })
    }
  }

  async deleteDocument({ params, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)
      const fileName = decodeURIComponent(params.docPath) // Decodifica o nome do arquivo

      if (!contrato.documentos) {
        return response.notFound('Documento não encontrado')
      }

      const documentos = contrato.documentos.split(',')
      // Procura o documento pelo nome do arquivo, não pelo caminho completo
      const docIndex = documentos.findIndex((doc) => doc.includes(fileName))

      if (docIndex === -1) {
        return response.notFound('Documento não encontrado')
      }

      const filePath = app.tmpPath('uploads/contrato_clt', fileName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      documentos.splice(docIndex, 1)
      contrato.documentos = documentos.length > 0 ? documentos.join(',') : null
      await contrato.save()

      return response.ok({
        message: 'Documento excluído com sucesso',
      })
    } catch (error) {
      return response.status(500).send({
        message: 'Erro ao excluir documento',
        details: error.message,
      })
    }
  }

  async updateDocumentName({ params, request, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)
      const { novoNome } = request.only(['novoNome'])
      const oldFileName = decodeURIComponent(params.docPath)

      if (!contrato.documentos) {
        return response.notFound('Documento não encontrado')
      }

      const documentos = contrato.documentos.split(',')
      const docIndex = documentos.findIndex((doc) => doc.includes(oldFileName))

      if (docIndex === -1) {
        return response.notFound('Documento não encontrado')
      }

      const oldPath = app.tmpPath(`uploads/contrato_clt/${oldFileName}`)
      const newPath = app.tmpPath(`uploads/contrato_clt/${novoNome}`)

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath)
        documentos[docIndex] = `/uploads/contrato_clt/${novoNome}`
        contrato.documentos = documentos.join(',')
        await contrato.save()

        return response.ok({
          message: 'Nome do documento atualizado com sucesso',
        })
      }

      return response.notFound('Arquivo não encontrado')
    } catch (error) {
      console.error('Erro ao atualizar nome:', error)
      return response.status(500).send({
        message: 'Erro ao atualizar nome do documento',
        details: error.message,
      })
    }
  }

  async downloadDocumento({ params, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)
      const fileName = decodeURIComponent(params.fileName)

      if (!contrato.documentos) {
        return response.notFound('Documento não encontrado')
      }

      const documentos = contrato.documentos.split(',')
      const docPath = documentos.find((doc) => {
        const docName = doc.split('/').pop()
        return docName === fileName
      })

      if (!docPath) {
        return response.notFound('Documento não encontrado')
      }

      // Construir o caminho completo do arquivo
      const filePath = app.tmpPath('uploads/contrato_clt', fileName)

      if (!fs.existsSync(filePath)) {
        return response.notFound('Arquivo físico não encontrado')
      }

      // Definir o tipo de conteúdo correto
      const mimeType = this.getMimeType(fileName)
      response.header('Content-Type', mimeType)
      response.header(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"`
      )

      return response.download(filePath)
    } catch (error) {
      console.error('Erro ao baixar documento:', error)
      return response.status(500).send({
        message: 'Erro ao baixar documento',
        details: error.message,
      })
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  async carregarDocumentos({ params, response }: HttpContext) {
    try {
      const contrato = await Contratoclt.findOrFail(params.id)

      // Se não houver documentos, retorna array vazio ao invés de erro
      if (!contrato.documentos) {
        return response.ok({ documentos: [] })
      }

      const documentos = contrato.documentos.split(',').map((path) => {
        const nome = path.split('/').pop()
        return {
          path,
          nome,
          url: `/download/contrato-clt/${params.id}/documento/${nome}`,
        }
      })

      return response.ok({ documentos })
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      return response.status(500).send({
        message: 'Erro ao carregar documentos do contrato',
        details: error.message,
      })
    }
  }
}
