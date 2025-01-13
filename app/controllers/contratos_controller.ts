/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Contrato from '#models/contratos'
import ContratoAnexo from '#models/contrato_anexo'
import ContratoItem from '#models/contrato_itens'
import Faturamento from '#models/faturamentos'
import FaturamentoItem from '#models/faturamento_item'
import Lancamento from '#models/lancamentos'
import LancamentoItens from '#models/lancamento_itens'
import { DateTime } from 'luxon'
import Renovacao from '#models/renovacao'
import axios from 'axios'
import Cidade from '#models/cidade'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import path from 'node:path'
import CurrentUserService from '#services/current_user_service'
import Logs from '#models/log'

export default class ContratosController {
  async createContract({ request, response }: HttpContext) {
    const {
      nome_contrato,
      nome_cliente,
      data_inicio,
      data_fim,
      lembrete_vencimento,
      observacoes,
      saldo_contrato,
      fiscal,
      ponto_focal,
      cidade,
      estado,
      objeto_contrato,
    } = request.only([
      'nome_contrato',
      'nome_cliente',
      'data_inicio',
      'data_fim',
      'lembrete_vencimento',
      'observacoes',
      'saldo_contrato',
      'fiscal',
      'ponto_focal',
      'cidade',
      'estado',
      'objeto_contrato',
    ])

    const items = request.input('items');

    try {
      const foto = request.file('foto', {
        size: '2mb',
        extnames: ['jpg', 'png', 'jpeg'],
      });

      let fotoFilePath = null;
      if (foto && foto.isValid) {
        const fotoFileName = `${new Date().getTime()}.${foto.extname}`;
        await foto.move(app.publicPath('uploads/contratos'), {
          name: fotoFileName,
        });
        fotoFilePath = `/uploads/contratos/${fotoFileName}`;
      }

      const fiscalData = {
        nome: fiscal?.nome || null,
        telefone: fiscal?.telefone || null,
        email: fiscal?.email || null,
      };

      const novoContrato = await Contrato.create({
        nome_contrato,
        nome_cliente,
        data_inicio,
        data_fim,
        lembrete_vencimento,
        observacoes,
        saldo_contrato,
        fiscal: fiscalData,
        ponto_focal,
        cidade,
        estado,
        objeto_contrato,
        foto: fotoFilePath,
      })

      let itemsArray = Array.isArray(items) ? items : [];

      if (items) {
        if (typeof items === 'string') {
          try {
            itemsArray = JSON.parse(items);
          } catch (error) {
            console.error('Erro ao fazer parse do campo items:', error);
            itemsArray = [];
          }
        } else if (Array.isArray(items)) {
          itemsArray = items;
        } else {
          itemsArray = [];
        }
      }

      let contratoComItens: ContratoItem[] = [];
      if (itemsArray.length > 0) {
        contratoComItens = await Promise.all(
          itemsArray.map(async (item) => {
            const novoItem = await ContratoItem.create({
              contrato_id: novoContrato.id,
              titulo: item.titulo,
              unidade_medida: item.unidade_medida,
              valor_unitario: item.valor_unitario,
              saldo_quantidade_contratada: item.saldo_quantidade_contratada,
            });
            return novoItem;
          })
        );
      }

      response.status(201).json({
        ...novoContrato.toJSON(),
        items: contratoComItens,
      })
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  async createTermoAditivo({ request, response }: HttpContext) {
    const {
      nome_contrato,
      data_inicio,
      data_fim,
      saldo_contrato,
      objeto_contrato,
      observacoes,
      porcentagem_ajuste,
      contrato_original_id,
    } = request.only([
      'nome_contrato',
      'data_inicio',
      'data_fim',
      'saldo_contrato',
      'objeto_contrato',
      'observacoes',
      'porcentagem_ajuste',
      'contrato_original_id',
    ]);

    try {
      const contratoOriginal = await Contrato.find(contrato_original_id);
      if (!contratoOriginal) {
        return response.status(404).json({ message: 'Contrato original não encontrado' });
      }

      const termoAditivo = await Contrato.create({
        nome_contrato,
        data_inicio,
        data_fim,
        saldo_contrato,
        objeto_contrato,
        observacoes,
        porcentagem_ajuste,
        termo_aditivo_id: contrato_original_id,
      });

      return response.status(201).json(termoAditivo);
    } catch (err) {
      console.error(err);
      return response.status(500).json({ message: 'Erro ao criar termo aditivo' });
    }
  }

  async uploadFoto({ params, request, response }: HttpContext) {
    const contratoId = params.id
    const contrato = await Contrato.find(contratoId)

    if (!contrato) {
      return response.status(404).json({ message: 'Contrato não encontrado' })
    }

    const foto = request.file('foto', {
      size: '5mb',
      extnames: ['jpg', 'png', 'jpeg'],
    })

    if (!foto || !foto.isValid) {
      return response.badRequest('Arquivo inválido ou não enviado.')
    }

    const fotoFileName = `${new Date().getTime()}.${foto.extname}`
    await foto.move(app.publicPath('uploads/contratos'), {
      name: fotoFileName,
    })

    contrato.foto = `/uploads/contratos/${fotoFileName}`
    await contrato.save()

    return response.ok({ message: 'Foto do contrato adicionada com sucesso!', foto: contrato.foto })
  }

  async getContracts({ response }: HttpContext) {
    try {
      const contratos = await this.fetchContracts()
      return response.json(contratos)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  private async fetchContracts({
    page,
    limit,
    sortBy,
    sortOrder,
    statusFaturamento,
    lembreteVencimento,
    cidade
  }: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
      statusFaturamento?: string;
      lembreteVencimento?: string;
      cidade?: string;
  } = {}) {
    try {
      let contratos = Contrato.query()
        .whereNull('deleted_at')
        .preload('contratoItens', (query) => {
          query.whereNull('renovacao_id').whereNull('deleted_at')
        })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery
            .whereNull('deleted_at')
            .select([
              'id',
              'contrato_id',
              'nota_fiscal',
              'data_faturamento',
              'status',
              'competencia',
              'observacoes',
              'created_at',
              'updated_at',
            ])
            .preload('faturamentoItens', (faturamentoItensQuery) => {
              faturamentoItensQuery
                .whereNull('deleted_at')
                .preload('lancamento', (lancamentoQuery) => {
                  lancamentoQuery
                    .whereNull('deleted_at')
                    .select(['id', 'status', 'projetos', 'data_medicao', 'competencia'])
                    .preload('lancamentoItens', (lancamentoItensQuery) => {
                      lancamentoItensQuery
                        .whereNull('deleted_at')
                        .select(['id', 'unidade_medida', 'valor_unitario', 'quantidade_itens'])
                    })
                })
            })
        })
        .preload('lancamentos', (query) => {
          query.whereNull('deleted_at')
          query.whereNull('renovacao_id')
          query.preload('lancamentoItens')
        })
        .preload('renovacao', (query) => {
          query.whereNull('deleted_at')
          query.preload('contratoItens')
          query.preload('lancamentos', (lancamentoQuery) => {
            lancamentoQuery.whereNull('deleted_at')
            lancamentoQuery.preload('lancamentoItens')
          })
        })

      if (statusFaturamento) {
        contratos = contratos
          .whereHas('faturamentos', (query) => {
            query.where('status', statusFaturamento)
          });
      }

      if (lembreteVencimento) {
        contratos = contratos.where('lembrete_vencimento', lembreteVencimento);
      }

      if (cidade) {
        contratos = contratos.where('cidade', cidade);
      }

      if (sortBy) {
        contratos = contratos.orderBy(sortBy, sortOrder);
      }

      if (page !== undefined && limit !== undefined) {
        return await contratos.paginate(page, limit);
      }

      return await contratos.exec()
    } catch (err) {
      console.error(err)
      throw new Error('Erro ao buscar contratos')
    }
  }

  async getContractById({ params, response }: HttpContext) {
    try {
      const contrato = await Contrato.query()
        .where('id', params.id)
        .whereNull('deleted_at')
        .preload('projetos')
        .preload('contratoItens', (query) => {
          query.whereNull('renovacao_id');
          query.whereNull('deleted_at');
        })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery
            .whereNull('deleted_at')
            .select([
              'id',
              'contrato_id',
              'nota_fiscal',
              'data_faturamento',
              'status',
              'observacoes',
              'created_at',
              'updated_at',
            ])
            .preload('faturamentoItens', (faturamentoItensQuery) => {
              faturamentoItensQuery
                .whereNull('deleted_at')
                .preload('lancamento', (lancamentoQuery) => {
                  lancamentoQuery
                    .whereNull('deleted_at')
                    .select(['id', 'status', 'projetos', 'data_medicao'])
                    .preload('lancamentoItens', (lancamentoItensQuery) => {
                      lancamentoItensQuery
                        .whereNull('deleted_at')
                        .select(['id', 'unidade_medida', 'valor_unitario', 'quantidade_itens']);
                    });
                });
            });
        })
        .preload('lancamentos', (query) => {
          query.whereNull('deleted_at');
          query.preload('lancamentoItens', (lancamentoItensQuery) => {
            lancamentoItensQuery.whereNull('deleted_at');
          });
        })
        .first();

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' });
      }

      const contratoData = contrato.toJSON();

      // Verifique se o contrato atual é um termo aditivo e, se for, preencha os campos `null`
      if (contratoData.termoAditivoId) {
        const contratoOriginal = await Contrato.query()
          .where('id', contratoData.termoAditivoId)
          .select([
            'id',
            'nome_cliente',
            'saldo_contrato',
            'fiscal',
            'ponto_focal',
            'cidade',
            'estado'
          ])
          .preload('projetos')
          .first();

        if (contratoOriginal) {
          const contratoOriginalData = contratoOriginal.toJSON();
          contratoData.idContratoOriginal = contratoOriginal.id;
          contratoData.nomeCliente = contratoData.nomeCliente ?? contratoOriginalData.nomeCliente;
          contratoData.fiscal = contratoData.fiscal ?? contratoOriginalData.fiscal;
          contratoData.pontoFocal = contratoData.pontoFocal ?? contratoOriginalData.pontoFocal;
          contratoData.cidade = contratoData.cidade ?? contratoOriginalData.cidade;
          contratoData.estado = contratoData.estado ?? contratoOriginalData.estado;
          contratoData.projetos = contratoData.projetos.length > 0 ? contratoData.projetos : contratoOriginalData.projetos;
          contratoData.saldoContratoOriginal = contratoOriginal.saldo_contrato;
        }
      }

      return response.json(contratoData);
    } catch (err) {
      console.error(err);
      return response.status(500).send('Erro no servidor');
    }
  }


  async getContractAndAditiveTerms({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const sortBy = request.input('sortBy', 'created_at')
      const sortOrder = request.input('sortOrder', 'asc')
      // const tipo = request.input('tipo', 'Todos')
      const dataInicio = request.input('dataInicio', null)
      const dataFim = request.input('dataFim', null)

      const contratosQuery = Contrato.query()
        .select('*')
        .whereNull('termo_aditivo_id')
        .if(search, (query) => {
          query.where('nome_contrato', 'ilike', `%${search}%`)
        })
        .if(dataInicio && dataFim, (query) => {
          query.where('data_inicio', '>=', dataInicio)
            .andWhere('data_fim', '<=', dataFim)
          })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery
            .whereNull('deleted_at')
            .select([
              'id',
              'contrato_id',
              'nota_fiscal',
              'data_faturamento',
              'status',
              'observacoes',
              'created_at',
              'updated_at',
            ])
            .preload('faturamentoItens', (faturamentoItensQuery) => {
              faturamentoItensQuery
                .whereNull('deleted_at')
                .preload('lancamento', (lancamentoQuery) => {
                  lancamentoQuery
                    .whereNull('deleted_at')
                    .select(['id', 'status', 'projetos', 'data_medicao'])
                    .preload('lancamentoItens', (lancamentoItensQuery) => {
                      lancamentoItensQuery
                        .whereNull('deleted_at')
                        .select(['id', 'unidade_medida', 'valor_unitario', 'quantidade_itens'])
                    })
                })
            })
        })
        .preload('lancamentos', (query) => {
          query.whereNull('deleted_at')
          query.preload('lancamentoItens', (lancamentoItensQuery) => {
            lancamentoItensQuery.whereNull('deleted_at')
          })
        })
        .preload('termosAditivos', (termoAditivoQuery) => {
          termoAditivoQuery
            .orderBy('created_at', 'desc')
            .select('*')
            .preload('faturamentos', (faturamentosQuery) => {
              faturamentosQuery
                .whereNull('deleted_at')
                .select([
                  'id',
                  'contrato_id',
                  'nota_fiscal',
                  'data_faturamento',
                  'status',
                  'observacoes',
                  'created_at',
                  'updated_at',
                ])
                .preload('faturamentoItens', (faturamentoItensQuery) => {
                  faturamentoItensQuery
                    .whereNull('deleted_at')
                    .preload('lancamento', (lancamentoQuery) => {
                      lancamentoQuery
                        .whereNull('deleted_at')
                        .select(['id', 'status', 'projetos', 'data_medicao'])
                        .preload('lancamentoItens', (lancamentoItensQuery) => {
                          lancamentoItensQuery
                            .whereNull('deleted_at')
                            .select(['id', 'unidade_medida', 'valor_unitario', 'quantidade_itens'])
                        })
                    })
                })
            })
            .preload('lancamentos', (query) => {
              query.whereNull('deleted_at')
              query.preload('lancamentoItens', (lancamentoItensQuery) => {
                lancamentoItensQuery.whereNull('deleted_at')
              })
            })
            .first()
        })
        .orderBy(sortBy, sortOrder)

      const contratosPaginados = await contratosQuery.paginate(page, limit)

      const contratosComTag = contratosPaginados.serialize().data.map((contrato) => ({
        ...contrato,
        tag: contrato.termoAditivoId ? 'Termo Aditivo' : 'Contrato'
      }))

      return response.json({
        meta: {
          total: contratosPaginados.total,
          per_page: limit,
          current_page: page,
          last_page: contratosPaginados.lastPage,
        },
        data: contratosComTag,
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({
        message: 'Erro ao listar contratos e termos aditivos',
        error: error.message || error,
      })
    }
  }

  async getTermosAditivos({ params, response }: HttpContext) {
    try {
      const contratoId = params.contrato_id;

      const termosAditivos = await Contrato.query()
        .where('termo_aditivo_id', contratoId)
        .whereNull('deleted_at')
        .select([
          'id',
          'termo_aditivo_id as contratoId',
          'nome_contrato',
          'saldo_contrato',
          'objeto_contrato',
          'data_inicio',
          'data_fim',
          'observacoes',
          'created_at',
          'updated_at',
        ])
        .orderBy('created_at', 'asc');

      if (termosAditivos.length === 0) {
        return response.status(404).json({ message: 'Nenhum termo aditivo encontrado para este contrato' });
      }

      const contratoOriginal = await Contrato.query()
        .where('id', contratoId)
        .select([
          'id',
          'nome_cliente',
          'saldo_contrato',
          'fiscal',
          'ponto_focal',
          'cidade',
          'estado'
        ])
        .preload('projetos')
        .first();

      if (!contratoOriginal) {
        return response.status(404).json({ message: 'Contrato original não encontrado' });
      }

      const contratoOriginalData = contratoOriginal.toJSON();

      const termosAditivosComContrato = termosAditivos.map((termoAditivo) => {
        const termoAditivoData = termoAditivo.toJSON();

        termoAditivoData.idContratoOriginal = contratoOriginal.id;
        termoAditivoData.nomeCliente = termoAditivoData.nomeCliente ?? contratoOriginalData.nomeCliente;
        termoAditivoData.fiscal = termoAditivoData.fiscal ?? contratoOriginalData.fiscal;
        termoAditivoData.pontoFocal = termoAditivoData.pontoFocal ?? contratoOriginalData.pontoFocal;
        termoAditivoData.cidade = termoAditivoData.cidade ?? contratoOriginalData.cidade;
        termoAditivoData.estado = termoAditivoData.estado ?? contratoOriginalData.estado;
        termoAditivoData.projetos = termoAditivoData.projetos ?? contratoOriginalData.projetos;

        return termoAditivoData;
      });

      return response.json(termosAditivosComContrato);
    } catch (err) {
      console.error(err);
      return response.status(500).json({
        message: 'Erro ao listar termos aditivos',
        error: err.message || err,
      });
    }
  }

  async updateContract({ params, request, response }: HttpContext) {
    try {
      const data = request.only([
        'nome_contrato',
        'nome_cliente',
        'data_inicio',
        'data_fim',
        'lembrete_vencimento',
        'observacoes',
        'porcentagem_ajuste',
        'saldo_contrato',
        'fiscal',
        'ponto_focal',
        'cidade',
        'estado',
        'objeto_contrato',
        'items',
      ]);

      const contrato = await Contrato.find(params.id);

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' });
      }

      if (data.nome_contrato !== undefined) contrato.nome_contrato = data.nome_contrato;
      if (data.nome_cliente !== undefined) contrato.nome_cliente = data.nome_cliente;
      if (data.data_inicio !== undefined) contrato.data_inicio = data.data_inicio;
      if (data.data_fim !== undefined) contrato.data_fim = data.data_fim;
      if (data.lembrete_vencimento !== undefined) contrato.lembrete_vencimento = data.lembrete_vencimento;
      if (data.observacoes !== undefined) contrato.observacoes = data.observacoes;
      if (data.porcentagem_ajuste !== undefined) contrato.porcentagem_ajuste = data.porcentagem_ajuste;
      if (data.saldo_contrato !== undefined) contrato.saldo_contrato = data.saldo_contrato;
      if (data.ponto_focal !== undefined) contrato.ponto_focal = data.ponto_focal;
      if (data.cidade !== undefined) contrato.cidade = data.cidade;
      if (data.estado !== undefined) contrato.estado = data.estado;
      if (data.objeto_contrato !== undefined) contrato.objeto_contrato = data.objeto_contrato;

      if (data.fiscal) {
        contrato.fiscal = {
          nome: data.fiscal.nome || contrato.fiscal?.nome,
          telefone: data.fiscal.telefone || contrato.fiscal?.telefone,
          email: data.fiscal.email || contrato.fiscal?.email,
        };
      }

      const foto = request.file('foto', {
        size: '2mb',
        extnames: ['jpg', 'png', 'jpeg'],
      });

      if (foto) {
        const fotoFileName = `${new Date().getTime()}.${foto.extname}`;
        await foto.move(app.publicPath('uploads/contratos'), {
          name: fotoFileName,
          overwrite: true,
        });

        contrato.foto = `/uploads/contratos/${fotoFileName}`;
      }

      await contrato.save();

      if (data.items && data.items.length > 0) {
        await Promise.all(
          data.items.map(
            async (item: {
              id?: number;
              titulo: string;
              unidade_medida: string;
              valor_unitario: string;
              saldo_quantidade_contratada: string;
            }) => {
              if (item.id) {
                const contratoItem = await ContratoItem.find(item.id);
                if (contratoItem) {
                  contratoItem.titulo = item.titulo;
                  contratoItem.unidade_medida = item.unidade_medida;
                  contratoItem.valor_unitario = item.valor_unitario;
                  contratoItem.saldo_quantidade_contratada = item.saldo_quantidade_contratada;
                  await contratoItem.save();
                }
              } else {
                await ContratoItem.create({
                  contrato_id: contrato.id,
                  titulo: item.titulo,
                  unidade_medida: item.unidade_medida,
                  valor_unitario: item.valor_unitario,
                  saldo_quantidade_contratada: item.saldo_quantidade_contratada,
                });
              }
            }
          )
        );
      }

      await contrato.load('contratoItens');

      return response.json(contrato);
    } catch (err) {
      console.error(err);
      return response.status(500).send('Erro no servidor');
    }
  }

  async deleteContract({ params, response }: HttpContext) {
    try {
      const contratoId = params.id
      const contrato = await Contrato.find(contratoId)
      Contrato.skipHooks = true

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      // Soft delete nos contratos itens relacionados
      await ContratoItem.query()
        .where('contrato_id', contratoId)
        .update({ deletedAt: DateTime.local() })

      // Soft delete nos lançamentos relacionados
      const lancamentos = await Lancamento.query().where('contrato_id', contratoId)
      for (const lancamento of lancamentos) {
        await LancamentoItens.query()
          .where('lancamento_id', lancamento.id)
          .update({ deletedAt: DateTime.local() })
        await lancamento.merge({ deletedAt: DateTime.local() }).save()
      }

      // Soft delete nos faturamentos relacionados
      const faturamentos = await Faturamento.query().where('contrato_id', contratoId)
      for (const faturamento of faturamentos) {
        await FaturamentoItem.query()
          .where('faturamento_id', faturamento.id)
          .update({ deletedAt: DateTime.local() })
        await faturamento.merge({ deletedAt: DateTime.local() }).save()
      }

      //Soft delete nas renovacoes relacionadas
      await Renovacao.query()
        .where('contrato_id', contratoId)
        .update({ deletedAt: DateTime.local() })

      const anexos = await ContratoAnexo.query().where('contrato_id', contratoId);
      for (const anexo of anexos) {
        const filePath = path.join(app.publicPath(), anexo.file_path);

        // Remove cada anexo fisico
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Erro ao deletar o arquivo ${filePath}:`, err);
          }
        }
      }
      // Hard delete dos anexos no banco
      await ContratoAnexo.query().where('contrato_id', contratoId).delete();

      // Soft delete no contrato
      await contrato.merge({ deletedAt: DateTime.local() }).save()

      try {
        const userId = CurrentUserService.getCurrentUserId()
        const username = CurrentUserService.getCurrentUsername()
        await Logs.create({
          userId: userId || 0,
          name: username || 'Usuário',
          action: 'Deletar',
          model: 'Contrato',
          modelId: contrato.id,
          description: `Usuário ${username} excluiu o contrato "${contrato.nome_contrato}" com ID ${contrato.id}.`,
        })
      } catch (error) {
        console.error('Erro ao criar o log de exclusão:', error)
      }

      return response.status(202).json({ message: 'Contrato deletado com sucesso.' })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    } finally {
      // Garantir que a flag seja desativada em qualquer caso
      Contrato.skipHooks = false
    }
  }

  async restoreContract({ params, response }: HttpContext) {
    try {
      const contratoId = params.id
      //
      const contrato: any = await Contrato.withTrashed().where('id', contratoId).firstOrFail()

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      // Restaurar os contratos itens relacionados
      await ContratoItem.query()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')
        .update({ deleted_at: null })

      // Restaurar os lançamentos relacionados
      const lancamentos: any = await Lancamento.withTrashed()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')

      for (const lancamento of lancamentos) {
        await LancamentoItens.query()
          .where('lancamento_id', lancamento.id)
          .whereNotNull('deleted_at')
          .update({ deleted_at: null })
        await lancamento.merge({ deletedAt: null }).save()
      }

      // Restaurar os faturamentos relacionados
      const faturamentos: any = await Faturamento.withTrashed()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')

      for (const faturamento of faturamentos) {
        await FaturamentoItem.query()
          .where('faturamento_id', faturamento.id)
          .whereNotNull('deleted_at')
          .update({ deleted_at: null })
        await faturamento.merge({ deletedAt: null }).save()
      }

      // Restaurar as renovações relacionadas
      await Renovacao.query()
        .where('contrato_id', contratoId)
        .whereNotNull('deleted_at')
        .update({ deleted_at: null })

      // Restaurar o contrato
      await contrato.merge({ deleted_at: null }).save()

      return response.status(202).json({ message: 'Contrato restaurado com sucesso.' })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }

  async getRelatorio({ params, request, response }: HttpContext) {
    try {
      const contratoId = params.id;
      const filtroProjetos = request.input('projetos', []);

      const contrato = await Contrato.query()
        .where('id', contratoId)
        .preload('contratoItens')
        .preload('projetos')
        .preload('lancamentos', (lancamentosQuery) => {
          lancamentosQuery
            .preload('lancamentoItens')
            .if(filtroProjetos.length > 0, (query) => {
              query.whereIn('projetos', filtroProjetos);
            });
        })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery.preload('faturamentoItens', (faturamentoItensQuery) => {
            faturamentoItensQuery.preload('lancamento').preload('lancamento', (lancamentoQuery) => {
              lancamentoQuery
                .whereNull('deleted_at')
                .select(['id', 'status', 'projetos', 'data_medicao'])
                .preload('lancamentoItens', (lancamentoItensQuery) => {
                  lancamentoItensQuery
                    .whereNull('deleted_at')
                    .select(['id', 'unidade_medida', 'valor_unitario', 'quantidade_itens']);
                });
            });
          });
        })
        .firstOrFail();

      const projetos = contrato.projetos.map((projeto) => ({
        id: projeto.id,
        nome: projeto.projeto,
      }));

      // Saldo Total e Atual
      const saldoTotal = Number(contrato.saldo_contrato) || 0;
      let saldoAtual = saldoTotal;

      (contrato.lancamentos || []).forEach((lancamento) => {
        (lancamento.lancamentoItens || []).forEach((item) => {
          saldoAtual -= Number(item.valor_unitario) * Number(item.quantidade_itens);
        });
      });

      // Série Histórica - Últimos 6 meses considerando apenas faturamentos com status "Pago"
      const hoje = DateTime.now().setLocale('pt-BR');
      const meses = Array.from({ length: 6 }, (_, index) =>
        hoje.minus({ months: 5 - index }).toFormat("MMM yyyy")
      ).map((mes) => {
        const [mesAbreviado, ano] = mes.split(" ");
        const mesSemPonto = mesAbreviado.replace('.', '');
        return `${mesSemPonto.charAt(0).toUpperCase()}${mesSemPonto.slice(1)} ${ano}`;
      });

      const pagamentosMensais = meses.map((mes) => {
        let total = 0;
        contrato.faturamentos
          .filter((faturamento) => faturamento.status === 'Pago')
          .forEach((faturamento) => {
            console.log('fat', faturamento.toJSON())
            let dataFaturamento;

            // Verifica se é um objeto Date e converte para ISO
            if (faturamento.data_faturamento instanceof Date) {
              dataFaturamento = DateTime.fromISO(faturamento.data_faturamento.toISOString());
            } else if (typeof faturamento.data_faturamento === 'string') {
              dataFaturamento = DateTime.fromISO(faturamento.data_faturamento);
            } else {
              console.log(`Data inválida encontrada: ${faturamento.data_faturamento}`);
              return;
            }

            if (!dataFaturamento.isValid) {
              console.log(`Data inválida encontrada: ${faturamento.data_faturamento}`);
              return;
            }

            const mesFaturamento = dataFaturamento.toFormat('MMM yyyy');
            if (mesFaturamento === mes) {
              faturamento.faturamentoItens.forEach((item) => {
                item.lancamento.lancamentoItens.forEach((lancamentoItem) => {
                  total += Number(lancamentoItem.valor_unitario) * Number(lancamentoItem.quantidade_itens);
                });
              });
            }
          });
        return total;
      });

      const serieHistorica = {
        months: meses,
        pagamentos: pagamentosMensais,
      };

      // Distribuição por Projeto com Status
      const distribuicaoPorProjeto: any = {};
      (contrato.faturamentos || []).forEach((faturamento) => {
        const status = faturamento.status || 'Indefinido';

        (faturamento.faturamentoItens || []).forEach((faturamentoItem: any) => {
          const lancamento = faturamentoItem.lancamento;
          if (!lancamento) return;

          // Filtrar apenas os projetos especificados (se fornecidos)
          if (filtroProjetos.length > 0 && !filtroProjetos.includes(lancamento.projetos)) {
            return;
          }

          const projeto = lancamento.projetos || 'Sem Projeto';
          if (!distribuicaoPorProjeto[projeto]) {
            distribuicaoPorProjeto[projeto] = {
              total: 0,
              pago: 0,
              aguardandoPagamento: 0,
              aguardandoFaturamento: 0,
            };
          }

          let totalLancamento = 0;
          (lancamento.lancamentoItens || []).forEach((item: any) => {
            totalLancamento += Number(item.valor_unitario) * Number(item.quantidade_itens);
          });

          distribuicaoPorProjeto[projeto].total += totalLancamento;

          // Classificar valores por status do faturamento
          if (status === 'Pago') {
            distribuicaoPorProjeto[projeto].pago += totalLancamento;
          } else if (status === 'Aguardando Pagamento') {
            distribuicaoPorProjeto[projeto].aguardandoPagamento += totalLancamento;
          } else if (status === 'Aguardando Faturamento') {
            distribuicaoPorProjeto[projeto].aguardandoFaturamento += totalLancamento;
          }
        });
      });

      // Distribuição de Valores por Status
      const distribuicaoPorStatus: any = {};
      (contrato.faturamentos || []).forEach((faturamento) => {

        const status = faturamento.status || 'Indefinido';

        // Filtrar apenas os projetos especificados (se fornecidos)
        if (
          filtroProjetos.length > 0 &&
          !faturamento.faturamentoItens.some((item: any) =>
            filtroProjetos.includes(item.lancamento?.projetos)
          )
        ) {
          return;
        }

        if (!distribuicaoPorStatus[status]) {
          distribuicaoPorStatus[status] = { total: 0 };
        }

        (faturamento.faturamentoItens || []).forEach((item: any) => {
          (item.lancamento?.lancamentoItens || []).forEach((lancamentoItem: any) => {
            distribuicaoPorStatus[status].total += Number(lancamentoItem.valor_unitario) * Number(lancamentoItem.quantidade_itens);
          });
        });
      });

      // Total de Projetos
      const totalProjetos = projetos.length;

      return response.status(200).json({
        contrato: contrato.toJSON(),
        saldoTotal,
        saldoAtual,
        serieHistorica,
        distribuicaoPorProjeto,
        distribuicaoPorStatus,
        totalProjetos,
      });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: 'Erro ao gerar o relatório', error });
    }
  }

  async getDashboard({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 5)
    const sortBy = request.input('sortBy', 'data_fim')
    const sortOrder = request.input('sortOrder', 'asc')
    const statusFaturamento = request.input('statusFaturamento', '');
    const lembreteVencimento = request.input('lembreteVencimento', '');
    const cidade = request.input('cidade', '');

    const contratos = await this.fetchContracts({
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder,
      statusFaturamento: statusFaturamento,
      lembreteVencimento: lembreteVencimento,
      cidade: cidade,
    });

    const contratosNoPagination = await this.fetchContracts({
      statusFaturamento: statusFaturamento,
      lembreteVencimento,
      cidade
    });

    const { stampTotalAguardandoFaturamento, stampTotalAguardandoPagamento, stampTotalPago, totalUtilizado } = await this.getStampData(contratosNoPagination)

    const stampTotalValorContratado = contratosNoPagination.reduce((acc, contrato) => {
      const saldo = Number(contrato.saldo_contrato) || 0
      return acc + saldo
    }, 0)
    const top5 = await this.getTop5Contratos(contratosNoPagination);
    const contratos_por_vencimento = await this.getContratosPorVencimento(contratosNoPagination);
    const map = await this.getCidadeData(contratosNoPagination);

    return response.json({
      valores_totais_status: {
        total_valor_contratado: stampTotalValorContratado,
        total_saldo_disponível: stampTotalValorContratado - totalUtilizado,
        total_aguardando_faturamento: stampTotalAguardandoFaturamento,
        total_aguardando_pagamento: stampTotalAguardandoPagamento,
        total_pago: stampTotalPago,
      },
      contratos_por_vencimento,
      top5,
      map,
      contratos: contratos,
    })
  }

  async getContratosPorVencimento(contratos: any) {
    return contratos.map((contrato: any) => {
      const dataFim = contrato.data_fim;
      const idContrato = contrato.id;
      const lembreteVencimento = contrato.lembrete_vencimento;

    let diasRestantes = null;
    let dataFimFormatada = null;

    if (dataFim) {
      const dataFimDate = DateTime.fromISO(dataFim);
      const hoje = DateTime.now();

      dataFimFormatada = dataFimDate.toFormat('yyyy-MM-dd');

      const diasRestantesCalculado = dataFimDate.diff(hoje, 'days').days;

        diasRestantes = Math.floor(diasRestantesCalculado);
      }

      return {
        id: idContrato,
        data_fim: dataFimFormatada,
        lembrete_vencimento: lembreteVencimento,
        dias_restantes: diasRestantes
      };
    });
  }

  async getTop5Contratos(contratos: any[]) {
    const calcularTotalUtilizadoTop5 = (contractId: any) => {
      const total = contratos
        .filter(contrato => contrato.id === contractId)
        .flatMap(contrato => contrato.faturamentos)
        .flatMap(faturamento => faturamento.faturamentoItens)
        .flatMap(faturamentoItem => faturamentoItem.lancamento.lancamentoItens)
        .reduce((sum, itemLancamento) => {
          const quantidadeItens = Number.parseFloat(itemLancamento.quantidade_itens) || 0;
          const valorUnitario = Number.parseFloat(itemLancamento.valor_unitario) || 0;
          return sum + quantidadeItens * valorUnitario;
        }, 0);
      return total;
    };

    const top5 = contratos.map(contrato => ({
      nome_cliente: contrato.nome_cliente,
      id: contrato.id,
      saldo_contrato: Number(contrato.saldo_contrato) || 0,
      totalUtilizado: calcularTotalUtilizadoTop5(contrato.id),
    }))
      .sort((a, b) => b.saldo_contrato - a.saldo_contrato)
      .slice(0, 5);
    return top5;
  }

  async getStampData(contratos: any[]) {
    const STATUS_AGUARDANDO_FATURAMENTO = 'Aguardando Faturamento'
    const STATUS_AGUARDANDO_PAGAMENTO = 'Aguardando Pagamento'
    const STATUS_PAGO = 'Pago'

    const calculateTotalByStatus = (status: string) => {
      return contratos.reduce((total, contrato) => {
        return (
          total +
          contrato.faturamentos
            .filter((faturamento: any) => faturamento.status === status)
            .flatMap((faturamento: any) => faturamento.faturamentoItens)
            .flatMap((faturamentoItem: any) => faturamentoItem.lancamento.lancamentoItens)
            .reduce((sum: any, itemLancamento: any) => {
              const quantidadeItens = Number.parseFloat(itemLancamento.quantidade_itens) || 0
              const valorUnitario = Number.parseFloat(itemLancamento.valor_unitario) || 0
              return sum + quantidadeItens * valorUnitario
            }, 0)
        )
      }, 0)
    }

    const stampTotalAguardandoFaturamento = await calculateTotalByStatus(STATUS_AGUARDANDO_FATURAMENTO)
    const stampTotalAguardandoPagamento = await calculateTotalByStatus(STATUS_AGUARDANDO_PAGAMENTO)
    const stampTotalPago = await calculateTotalByStatus(STATUS_PAGO)
    const totalUtilizado = stampTotalAguardandoFaturamento + stampTotalAguardandoPagamento + stampTotalPago
    return {
      stampTotalAguardandoFaturamento,
      stampTotalAguardandoPagamento,
      stampTotalPago,
      totalUtilizado,
    }
  }

  async getCidadeData(contratos: Array<{ cidade: string; estado: string; saldo_contrato: string }>): Promise<Array<{ cidade: string; estado: string; latitude: string | null; longitude: string | null; valor_total: number }>> {
    const cidadeDataMap: { [key: string]: { total: number; latitude: string | null; longitude: string | null; quantidade: number } } = {};

    for (const contrato of contratos) {
      const cidade = contrato.cidade;
      const estado = contrato.estado;
      const valorContratado = Number(contrato.saldo_contrato) || 0;
      const key = `${cidade}, ${estado}`;

      if (!cidadeDataMap[`${cidade}, ${estado}`]) {
        const locationData = await fetchLocationData(cidade, estado);
        cidadeDataMap[`${cidade}, ${estado}`] = {
          total: 0,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          quantidade: 0,
        };
      }

      cidadeDataMap[`${cidade}, ${estado}`].total += valorContratado;
      cidadeDataMap[key].quantidade += 1;
    }

    return Object.keys(cidadeDataMap).map(cidadeEstado => {
      const [cidade, estado] = cidadeEstado.split(', ');
      const data = cidadeDataMap[cidadeEstado];
      return {
        cidade,
        estado,
        latitude: data.latitude,
        longitude: data.longitude,
        valor_total: data.total,
        quantidade_contratos: data.quantidade,
      };
    });
  }

}

const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchLocationData(cidade: string, estado: string): Promise<{ latitude: string | null; longitude: string | null }> {
  try {
    const cityData = await Cidade.query()
      .where('cidade', cidade)
      .where('estado', estado)
      .first();

    if (cityData) {
      return {
        latitude: cityData.latitude,
        longitude: cityData.longitude,
      };
    }

    await sleep(2000);

    // Se não existir cidade e estado, faz a requisição ao Nominatim
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${cidade}, ${estado}`,
        format: 'json',
        addressdetails: 1,
      },
    });
    const data = res.data[0];
    if (data) {
      const latitude = data.lat;
      const longitude = data.lon;

      // Armazena a nova coordenada no banco de dados
      await Cidade.updateOrCreate(
        { cidade, estado },
        { latitude, longitude }
      );

      return { latitude, longitude };
    }
  } catch (error) {
    console.error(`Erro ao tentar buscar localização para ${cidade}`, error);
  }

  return { latitude: null, longitude: null };
}
