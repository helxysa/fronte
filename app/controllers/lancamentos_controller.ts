/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Lancamentos from '#models/lancamentos'
import LancamentoItens from '#models/lancamento_itens'
import ContratoItens from '#models/contrato_itens'
import { DateTime } from 'luxon'
import FaturamentoItem from '#models/faturamento_item'
import MedicaoAnexo from '#models/medicao_anexo'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import path from 'node:path'
import CurrentUserService from '#services/current_user_service'
import Logs from '#models/log'

export default class LancamentosController {
  async createLancamento({ request, response, params }: HttpContext) {
    const { id } = params
    const { status, projetos, data_medicao, itens, tarefa_medicao, tipo_medicao, competencia, descricao, dias } = request.only([
      'status',
      'itens',
      'projetos',
      'data_medicao',
      'tarefa_medicao',
      'tipo_medicao',
      'competencia',
      'descricao',
      'dias'
    ])

    if (tipo_medicao === 'Relatório Mensal' && (dias === undefined)) {
      return response.status(400).send('O campo "dias" é obrigatório para o tipo Relatório Mensal.');
    }

    if (!projetos || !itens || !itens.length) {
      return response.status(400).send('Nome do projeto e itens são obrigatórios.')
    }

    try {
      // Verificação se já existe um lançamento com a mesma tarefa para o contrato
      let existeLancamento: any = null;

      if (tarefa_medicao !== '' && tarefa_medicao !== null) {
        existeLancamento = await Lancamentos.query()
          .where('contrato_id', id)
          .andWhere('tarefa_medicao', tarefa_medicao)
          .first();
      }

      if (existeLancamento) {
        return response.status(400).send('Já existe uma medição com a mesma tarefa para este contrato.');
      }

      const competenciaDate = DateTime.fromFormat(competencia, 'yyyy-MM');
      if (!competenciaDate.isValid) {
        return response.status(400).send('Formato de competência inválido. Use "YYYY-MM".');
      }

      // const competenciaFormatted = competenciaDate.toFormat('yyyy-MM-01');

      // Criação do novo lançamento
      const novoLancamento = await Lancamentos.create({
        contrato_id: id,
        status: status || null,
        projetos: projetos,
        data_medicao: data_medicao,
        tarefa_medicao,
        tipo_medicao,
        competencia: competenciaDate,
        descricao,
        dias: tipo_medicao === 'Relatório Mensal' ? dias : null
      })

      // Processamento dos itens
      const lancamentoComItens = await Promise.all(
        itens.map(async (item: { id_item: number; quantidade_itens: string; }) => {
          if (!item.id_item) {
            throw new Error('Cada item deve conter id do item e a quantidade de itens.')
          }

          // Verificação se o item de contrato existe
          const contratoItem = await ContratoItens.find(item.id_item)
          if (!contratoItem) {
            throw new Error(`Item de contrato com id ${item.id_item} não encontrado.`)
          }

          // Criação do item no lançamento
          const novoItem = await LancamentoItens.create({
            lancamento_id: novoLancamento.id,
            contrato_item_id: contratoItem.id,
            titulo: contratoItem.titulo,
            unidade_medida: contratoItem.unidade_medida,
            valor_unitario: contratoItem.valor_unitario,
            saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
            quantidade_itens: item.quantidade_itens || '0',
          })
          return novoItem
        })
      )

      // Retorno da resposta com sucesso
      return response.status(201).json({
        ...novoLancamento.toJSON(),
        itens: lancamentoComItens,
      })
    } catch (err) {
      console.error('Erro ao criar lançamento:', err)
      if (err instanceof Error) {
        return response.status(500).send(`Erro no servidor: ${err.message}`)
      }
      return response.status(500).send('Erro inesperado no servidor.')
    }
  }

  async getLancamentos({ response }: HttpContext) {
    try {
      const lancamentos = await Lancamentos.query()
        .whereNull('renovacao_id')
        .preload('lancamentoItens')
        .exec()
      return response.json(lancamentos)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async getLancamentoByContract({ params, request, response }: HttpContext) {
    const { id } = params
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const sortBy = request.input('sortBy', 'created_at')
    const sortOrder = request.input('sortOrder', 'desc')
    let statuses = request.input('statuses', null);
    try {
      const query = Lancamentos.query()
      .where('contrato_id', id)
      .preload('lancamentoItens')
      .orderBy(sortBy, sortOrder);

      if (statuses) {
        if (typeof statuses === 'string') {
          statuses = [statuses];
        }
        else if (!Array.isArray(statuses)) {
          statuses = [statuses];
        }

        if (statuses.length === 1) {
          query.where('status', statuses[0]);
        } else {
          query.whereIn('status', statuses);
        }
      }

    const lancamento = await query.paginate(page, limit);

      if (!lancamento) {
      return response.status(404).send('Lançamento não encontrado.');
      }

      return response.json(lancamento)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async getLancamentoById({ params, response }: HttpContext) {
    const { id } = params

    try {
      const lancamento = await Lancamentos.query()
        .where('id', id)
        .preload('lancamentoItens')
        .first()

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      return response.json(lancamento)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async updateLancamento({ request, response, params }: HttpContext) {
    const { id } = params
    const { status, itens, projetos, data_medicao, tarefa_medicao, tipo_medicao, competencia, descricao, dias} = request.only([
      'status',
      'itens',
      'projetos',
      'data_medicao',
      'tarefa_medicao',
      'tipo_medicao',
      'competencia',
      'descricao',
      'dias'
    ])

    if (tipo_medicao === 'Relatório Mensal' && (dias === undefined)) {
      return response.status(400).send('O campo "dias" é obrigatório para o tipo Relatório Mensal.');
    }

    try {
      const lancamentoAtual = await Lancamentos.find(id)
      if (!lancamentoAtual) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      const dataMedicao = DateTime.fromFormat(data_medicao, 'yyyy-MM-dd');
      if (!dataMedicao) {
        return response.status(400).send('Data de medição inválida.');
      }
      let existeLancamento: any = null;

      if (tarefa_medicao !== '' && tarefa_medicao !== null) {
        existeLancamento = await Lancamentos.query()
          .where('contrato_id', lancamentoAtual.contrato_id)
          .andWhere('tarefa_medicao', tarefa_medicao)
          .whereNot('id', id)
          .first()
      }
      if (existeLancamento) {
        return response
          .status(400)
          .send('Já existe uma medição com a mesma tarefa para este contrato.')
      }

      const competenciaDate = DateTime.fromFormat(competencia, 'yyyy-MM');
      if (!competenciaDate.isValid) {
        return response.status(400).send('Formato de competência inválido. Use "YYYY-MM".');
      }

      lancamentoAtual.status = status
      lancamentoAtual.projetos = projetos
      lancamentoAtual.tarefa_medicao = tarefa_medicao
      lancamentoAtual.tipo_medicao = tipo_medicao
      lancamentoAtual.competencia = competenciaDate
      lancamentoAtual.descricao = descricao
      lancamentoAtual.data_medicao = dataMedicao;
      lancamentoAtual.dias = tipo_medicao === 'Relatório Mensal' ? dias : null;

      await lancamentoAtual.save()

      await Promise.all(
        itens.map(async (item: { id_item: number; quantidade_itens: string; }) => {
          const lancamentoItem = await LancamentoItens.find(item.id_item)

          if (lancamentoItem) {
            lancamentoItem.merge({
              quantidade_itens: item.quantidade_itens,
            })
            await lancamentoItem.save()
          }
        })
      )

      await lancamentoAtual.load('lancamentoItens')

      return response.status(200).json(lancamentoAtual)
    } catch (err) {
      console.error('Erro ao atualizar lançamento:', err)
      return response.status(500).json({
        error: 'Erro interno do servidor.',
        message: err.message,
        statusCode: 500
      })
    }
  }

  async updateCompetencia({ request, response, params }: HttpContext) {
    const { id } = params;
    const { competencia } = request.only(['competencia']);

    try {
      const lancamentoAtual = await Lancamentos.find(id);
      if (!lancamentoAtual) {
        return response.status(404).send('Medição não encontrada.');
      }

      if (!competencia) {
        return response.status(400).send('O campo "Competência" é obrigatório.');
      }

      const competenciaDate = DateTime.fromFormat(competencia, 'yyyy-MM');
      if (!competenciaDate.isValid) {
        return response.status(400).send('Formato de competência inválido. Use "YYYY-MM".');
      }

      lancamentoAtual.competencia = competenciaDate;
      await lancamentoAtual.save();

      return response.status(200).json(lancamentoAtual);
    } catch (err) {
      console.error('Erro ao atualizar competência da medição:', err);
      return response.status(500).json({
        error: 'Erro interno do servidor.',
        message: err.message,
        statusCode: 500
      });
    }
  }

  async updateStatus({ request, response, params }: HttpContext) {
    const { id } = params;
    const { status } = request.only(['status']);

    try {
      const lancamentoAtual = await Lancamentos.find(id);
      if (!lancamentoAtual) {
        return response.status(404).send('Medição não encontrada.');
      }

      if (!status) {
        return response.status(400).send('O campo "Status" é obrigatório.');
      }

      lancamentoAtual.status = status;
      await lancamentoAtual.save();

      return response.status(200).json(lancamentoAtual);
    } catch (err) {
      console.error('Erro ao atualizar status da medição:', err);
      return response.status(500).json({
        error: 'Erro interno do servidor.',
        message: err.message,
        statusCode: 500
      });
    }
  }


  async deleteLancamento({ params, response }: HttpContext) {
    const { id } = params

    try {
      const lancamento = await Lancamentos.find(id)

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      const relacionados = await FaturamentoItem.query()
        .where('lancamento_id', id)
        .count('* as total')

      const totalRelacionados = Number.parseInt(relacionados[0].$extras.total, 10) || 0

      if (totalRelacionados > 0) {
        return response.status(400).json({
          message:
            'Não foi possível deletar o lançamento, pois está vínculado com um ou mais faturamentos.',
        })
      }

      //soft delete nos itens relacionados ao lançamento
      await LancamentoItens.query()
        .where('lancamento_id', params.id)
        .update({ deletedAt: DateTime.local() })

      const anexos = await MedicaoAnexo.query().where('lancamento_id', id);
      for (const anexo of anexos) {
        const filePath = path.join(app.publicPath(), anexo.file_path);

        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Erro ao deletar o arquivo ${filePath}:`, err);
          }
        }
      }
      await MedicaoAnexo.query().where('lancamento_id', id).delete()

      await lancamento.delete()

      try {
        const userId = CurrentUserService.getCurrentUserId();
        const username = CurrentUserService.getCurrentUsername();
        const contrato = await lancamento.related('contratos').query().first();
        if (!contrato) {
          return response.status(404).json({ message: 'Contrato relacionado à medição não encontrado.' });
        }
        await Logs.create({
          userId: userId || 0,
          name: username || 'Usuário',
          action: 'Deletar',
          model: 'Lancamentos',
          modelId: lancamento.id,
          description: `${username} excluiu a medição com ID ${lancamento.id} do contrato "${contrato.nome_contrato}".`,
        });
      } catch (error) {
        console.error('Erro ao criar o log de exclusão:', error);
      }

      return response.status(200).send('Lançamento deletado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async restoreLancamento({ params, response }: HttpContext) {
    const { id } = params

    try {
      const lancamento: any = await Lancamentos.withTrashed().where('id', id).firstOrFail()

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado.')
      }

      //soft delete nos itens relacionados ao lançamento
      await LancamentoItens.query().where('lancamento_id', params.id).update({ deletedAt: null })
      await lancamento.restore()

      return response.status(200).send('Lançamento restaurado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async deleteLancamentoItem({ params, response }: HttpContext) {
    const { id, itemId } = params

    try {
      const lancamentoItem = await LancamentoItens.query()
        .where('lancamento_id', id)
        .andWhere('id', itemId)
        .first()

      if (!lancamentoItem) {
        return response.status(404).send('item do lancamento não encontrado.')
      }

      await lancamentoItem.delete()

      return response.status(200).send('Item do lancamento deletado com sucesso.')
    } catch (err) {
      console.error(err)
      return response.status(500).send('Server error')
    }
  }

  async addLancamentoItem({ request, response, params }: HttpContext) {
    const { id } = params
    const { contrato_item_id, quantidade_itens } = request.only([
      'contrato_item_id',
      'quantidade_itens',
    ])

    try {
      const lancamento = await Lancamentos.query().where('id', id).preload('contratos').first()

      if (!lancamento) {
        return response.status(404).send('Lançamento não encontrado')
      }

      const contratoItem = await ContratoItens.query()
        .where('id', contrato_item_id)
        .where('contrato_id', lancamento.contratos.id)
        .first()

      if (!contratoItem) {
        return response
          .status(404)
          .send('Item do contrato não encontrado ou não associado ao contrato do lançamento.')
      }

      const lancamentoItem = await LancamentoItens.create({
        lancamento_id: lancamento.id,
        contrato_item_id: contratoItem.id,
        titulo: contratoItem.titulo,
        unidade_medida: contratoItem.unidade_medida,
        valor_unitario: contratoItem.valor_unitario,
        saldo_quantidade_contratada: contratoItem.saldo_quantidade_contratada,
        quantidade_itens: quantidade_itens,
      })

      return response.status(201).json(lancamentoItem)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }
}
