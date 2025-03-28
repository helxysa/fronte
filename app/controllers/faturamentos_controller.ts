/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Faturamentos from '#models/faturamentos'
import FaturamentoItem from '#models/faturamento_item'
import Contrato from '#models/contratos'
import { DateTime } from 'luxon'
import FaturamentoAnexo from '#models/faturamento_anexo'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import path from 'node:path'
import CurrentUserService from '#services/current_user_service'
import Logs from '#models/log'

export default class FaturamentosController {
  async createFaturamentos({ params, request, response }: HttpContext) {
    const { nota_fiscal, data_faturamento, descricao_nota, status, observacoes, competencia } = request.only([
      'nota_fiscal',
      'data_faturamento',
      'descricao_nota',
      'status',
      'observacoes',
      'competencia'
    ])

    try {
      const contrato = await Contrato.find(params.id)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      const notaArray = Array.isArray(descricao_nota) ? descricao_nota : []

      const competenciaDate = DateTime.fromFormat(competencia, 'yyyy-MM');
      if (!competenciaDate.isValid) {
        return response.status(400).send('Formato de competência inválido. Use "YYYY-MM".');
      }

      const faturamento = await Faturamentos.create({
        contrato_id: contrato.id,
        nota_fiscal,
        data_faturamento,
        status,
        observacoes,
        competencia: competenciaDate,
      })

      for (const lancamentoId of notaArray) {
        await FaturamentoItem.create({
          faturamento_id: faturamento.id,
          lancamento_id: lancamentoId,
        })
      }

      await faturamento.load('faturamentoItens', (faturamentoItensQuery) => {
        faturamentoItensQuery.preload('lancamento', (lancamentoQuery: any) => {
          lancamentoQuery.preload('lancamentoItens')
        })
      })

      return response.status(201).json(faturamento)
    } catch (error) {
      console.error(error)
      response.status(500).send('erro ao criar faturamento.')
    }
  }

  async updateFaturamento({ params, request, response }: HttpContext) {
    const faturamentoId = params.id

    // Verifica se o ID é um número válido
    if (faturamentoId <= 0) {
      return response.status(400).json({ message: 'ID inválido.' })
    }

    // Obtém os dados para atualização
    const { nota_fiscal, data_faturamento, descricao_nota, status, observacoes, competencia } = request.only([
      'nota_fiscal',
      'data_faturamento',
      'descricao_nota',
      'status',
      'observacoes',
      'competencia'
    ])

    // Encontra o faturamento
    const faturamento = await Faturamentos.find(faturamentoId)

    if (!faturamento) {
      return response.status(404).json({ message: 'Faturamento não encontrado.' })
    }

    let competenciaDate = null;
    if (competencia) {
      competenciaDate = DateTime.fromFormat(competencia, 'yyyy-MM');
      if (!competenciaDate.isValid) {
        return response.status(400).send('Formato de competência inválido. Use "YYYY-MM".');
      }
    }

    // Atualiza os campos do faturamento
    faturamento.nota_fiscal = nota_fiscal ?? faturamento.nota_fiscal
    faturamento.data_faturamento = data_faturamento ? DateTime.fromISO(data_faturamento) : faturamento.data_faturamento
    faturamento.status = status ?? faturamento.status
    faturamento.observacoes = observacoes ?? faturamento.observacoes
    faturamento.competencia = competenciaDate ? competenciaDate : faturamento.competencia;
    await faturamento.save()

    // Atualiza os itens do faturamento se necessário
    if (descricao_nota) {
      const notaArray = Array.isArray(descricao_nota) ? descricao_nota : []

      // Remove todos os itens existentes
      await FaturamentoItem.query().where('faturamento_id', faturamentoId).delete()

      // Adiciona os novos itens
      for (const lancamentoId of notaArray) {
        await FaturamentoItem.create({
          faturamento_id: faturamentoId,
          lancamento_id: lancamentoId,
        })
      }
    }

    await faturamento.load('faturamentoItens', (faturamentoItensQuery) => {
      faturamentoItensQuery.preload('lancamento', (lancamentoQuery: any) => {
        lancamentoQuery.preload('lancamentoItens')
      })
    })

    return response.status(200).json(faturamento)
  }

  async getFaturamentosByContratoId({ params, request, response }: HttpContext) {
    const { id } = params;
    const page = request.input('page', 1);
    const limit = request.input('limit', 10);
    const sortBy = request.input('sortBy', 'created_at');
    const sortOrder = request.input('sortOrder', 'desc');
    const search = request.input('search', '');

    try {
      const query = Faturamentos.query()
        .where('contrato_id', id)
        .select([
          'id',
          'contrato_id',
          'nota_fiscal',
          'data_faturamento',
          'status',
          'observacoes',
          'competencia',
          'created_at',
          'updated_at',
        ])
        .preload('faturamentoItens', (faturamentoItensQuery) => {
          faturamentoItensQuery.preload('lancamento', (lancamentoQuery) => {
            lancamentoQuery
              .select(['id', 'status', 'projetos', 'data_medicao', 'competencia', 'dias'])
              .preload('lancamentoItens', (lancamentoItensQuery) => {
                lancamentoItensQuery.select([
                  'id',
                  'titulo',
                  'unidade_medida',
                  'valor_unitario',
                  'quantidade_itens',
                  'convertido'
                ]);
              });
          });
        })
        .orderBy(sortBy, sortOrder);

      if (search) {
        query.where((builder) => {
          builder
            .whereRaw('CAST(id AS TEXT) ILIKE ?', [`%${search}%`])
            .orWhere('nota_fiscal', 'ilike', `%${search}%`)
            .orWhere('status', 'ilike', `%${search}%`)
        });
      }

      const faturamentos = await query.paginate(page, limit);

      if (!faturamentos) {
        return response.status(404).json({ message: 'Nenhum faturamento encontrado para o contrato fornecido.' })
      }

      return response.status(200).json(faturamentos);
    } catch (error) {
      console.error(error);
      return response
        .status(500)
        .json({ message: 'Erro ao buscar faturamentos', error: error.message });
    }
  }

  async getFinancialSummaryByContratoId({ params, response }: HttpContext) {
    const { id } = params;

    try {
        const exists = await Faturamentos.query()
            .where('contrato_id', id)
            .first();

        if (!exists) {
            return response.status(404).json({
                message: 'Nenhum valor foi encontrado para o contrato fornecido.'
            });
        }

        const query = Faturamentos.query()
            .where('contrato_id', id)
            .select([
                'id',
                'contrato_id',
                'nota_fiscal',
                'data_faturamento',
                'status',
                'observacoes',
                'competencia',
                'created_at',
                'updated_at',
            ])
            .preload('faturamentoItens', (faturamentoItensQuery) => {
                faturamentoItensQuery.preload('lancamento', (lancamentoQuery) => {
                    lancamentoQuery
                        .select(['id', 'status', 'projetos', 'data_medicao', 'competencia', 'dias'])
                        .preload('lancamentoItens', (lancamentoItensQuery) => {
                            lancamentoItensQuery.select([
                                'id',
                                'titulo',
                                'unidade_medida',
                                'valor_unitario',
                                'quantidade_itens',
                                'convertido'
                            ]);
                        });
                });
            });

        const result = await query;
        return response.status(200).json(result);
    } catch (error) {
        console.error(error);
        return response
            .status(500)
            .json({
                message: 'Erro ao buscar resumo financeiro',
                error: error.message
            });
    }
}
  async deleteFaturamento({ params, response }: HttpContext) {
    const faturamentoId = Number(params.id)

    if (faturamentoId <= 0) {
      return response.status(400).json({ message: 'ID inválido.' })
    }

    const faturamento = await Faturamentos.find(faturamentoId)

    if (!faturamento) {
      return response.status(404).json({ message: 'Faturamento não encontrado.' })
    }

    // Soft delete nos itens relacionados do faturamento
    await FaturamentoItem.query()
      .where('faturamento_id', faturamentoId)
      .update({ deletedAt: DateTime.local() })

    const anexos = await FaturamentoAnexo.query().where('faturamento_id', faturamentoId);
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
    await FaturamentoAnexo.query().where('faturamento_id', faturamentoId).delete()

    // Soft delete no faturamento
    await faturamento.delete()


    try {
      const userId = CurrentUserService.getCurrentUserId();
      const username = CurrentUserService.getCurrentUsername();
      const contrato = await faturamento.related('contrato').query().first();
      if (!contrato) {
        return response.status(404).json({ message: 'Contrato relacionado ao faturamento não encontrado.' });
      }
      await Logs.create({
        userId: userId || 0,
        name: username || 'Usuário',
        action: 'Deletar',
        model: 'Faturamentos',
        modelId: faturamentoId,
        description: `${username} excluiu o faturamento com ID ${faturamentoId} do contrato "${contrato.nome_contrato}".`,
      });
    } catch (error) {
      console.error('Erro ao criar o log de exclusão:', error);
    }

    return response.status(200).json({ message: 'Faturamento deletado com sucesso.' })
  }

  async restoreFaturamento({ params, response }: HttpContext) {
    const faturamentoId = params.id

    if (faturamentoId <= 0) {
      return response.status(400).json({ message: 'ID inválido.' })
    }

    try {
      const faturamento: any = await Faturamentos.withTrashed()
        .where('id', faturamentoId)
        .firstOrFail()
      const faturamentoItens = FaturamentoItem.query().where('faturamento_id', faturamentoId)

      if (!faturamento) {
        return response.status(404).json({ message: 'Faturamento não encontrado.' })
      }

      // Restaura os itens relacionados do faturamento
      await faturamentoItens.update({ deletedAt: null })
      // Restaura o faturamento
      await faturamento.restore()
      return response.status(200).json({ message: 'Faturamento restaurado com sucesso.' })
    } catch (error) {
      return response.status(404).json({
        message: 'Faturamento não encontrado.',
      })
    }
  }
}
