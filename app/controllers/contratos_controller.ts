/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Contrato from '#models/contratos'
import ContratoItem from '#models/contrato_itens'
import Faturamento from '#models/faturamentos'
import FaturamentoItem from '#models/faturamento_item'
import Lancamento from '#models/lancamentos'
import LancamentoItens from '#models/lancamento_itens'
import { DateTime } from 'luxon'
import Renovacao from '#models/renovacao'
import axios from 'axios'
import Cidade from '#models/cidade'

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
      fiscal: { nome, telefone, email },
      ponto_focal,
      cidade,
      estado,
      objeto_contrato,
      items,
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
      'items',
    ])

    try {
      const novoContrato = await Contrato.create({
        nome_contrato,
        nome_cliente,
        data_inicio,
        data_fim,
        lembrete_vencimento,
        observacoes,
        saldo_contrato,
        fiscal: { nome, telefone, email },
        ponto_focal,
        cidade,
        estado,
        objeto_contrato,
      })

      const contratoComItens = await Promise.all(
        items.map(
          async (item: {
            titulo: string
            unidade_medida: string
            valor_unitario: string
            saldo_quantidade_contratada: string
          }) => {
            const novoItem = await ContratoItem.create({
              contrato_id: novoContrato.id,
              titulo: item.titulo,
              unidade_medida: item.unidade_medida,
              valor_unitario: item.valor_unitario,
              saldo_quantidade_contratada: item.saldo_quantidade_contratada,
            })
            return novoItem
          }
        )
      )

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
      contrato_original_id,
    } = request.only([
      'nome_contrato',
      'data_inicio',
      'data_fim',
      'saldo_contrato',
      'objeto_contrato',
      'observacoes',
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
        termo_aditivo_id: contrato_original_id,
      });

      return response.status(201).json(termoAditivo);
    } catch (err) {
      console.error(err);
      return response.status(500).json({ message: 'Erro ao criar termo aditivo' });
    }
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
          query.whereNull('renovacao_id')
          query.whereNull('deleted_at')
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
        .preload('contrato', (contratoQuery) => {
          contratoQuery.select(['id', 'nome_cliente', 'fiscal', 'ponto_focal', 'cidade', 'estado']).preload('projetos')
        })
        .first()

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      return response.json(contrato)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }

  async getContractAndAditiveTerms({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const sortBy = request.input('sortBy', 'created_at')
      const sortOrder = request.input('sortOrder', 'asc')
      const tipo = request.input('tipo', 'Todos')
      const dataInicio = request.input('dataInicio', null)
      const dataFim = request.input('dataFim', null)

      const contratosQuery = Contrato.query()
        .select('*')
        .if(tipo === 'Contratos', (query) => {
          query.whereNull('termo_aditivo_id')
        })
        .if(tipo === 'Termos Aditivos', (query) => {
          query.whereNotNull('termo_aditivo_id')
        })
        .if(search, (query) => {
          query.where('nome_contrato', 'ilike', `%${search}%`)
        })
        .if(dataInicio && dataFim, (query) => {
          query.where('data_inicio', '>=', dataInicio)
            .andWhere('data_fim', '<=', dataFim)
          })
        .preload('contrato', (contratoQuery) => {
          contratoQuery.select(['id', 'nome_cliente', 'fiscal', 'ponto_focal', 'cidade', 'estado'])
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

      const termosAditivosComContrato = termosAditivos.map((termoAditivo) => {
        const termoAditivoData = termoAditivo.toJSON();
        termoAditivoData.contrato = contratoOriginal.toJSON();
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

  // async updateContract({ params, request, response }: HttpContext) {
  //   try {
  //     const {
  //       nome_contrato,
  //       nome_cliente,
  //       data_inicio,
  //       data_fim,
  //       lembrete_vencimento,
  //       observacoes,
  //       saldo_contrato,
  //       fiscal: { nome, telefone, email },
  //       ponto_focal,
  //       cidade,
  //       estado,
  //       objeto_contrato,
  //       items,
  //     } = request.only([
  //       'nome_contrato',
  //       'nome_cliente',
  //       'data_inicio',
  //       'data_fim',
  //       'lembrete_vencimento',
  //       'observacoes',
  //       'saldo_contrato',
  //       'fiscal',
  //       'ponto_focal',
  //       'cidade',
  //       'estado',
  //       'objeto_contrato',
  //       'items',
  //     ])

  //     const contrato = await Contrato.find(params.id)

  //     if (!contrato) {
  //       return response.status(404).json({ message: 'Contrato não encontrado' })
  //     }

  //     contrato.nome_contrato = nome_contrato
  //     contrato.nome_cliente = nome_cliente
  //     contrato.data_inicio = data_inicio
  //     contrato.data_fim = data_fim
  //     contrato.lembrete_vencimento = lembrete_vencimento
  //     contrato.observacoes = observacoes
  //     contrato.saldo_contrato = saldo_contrato
  //     contrato.fiscal = { nome, telefone, email }
  //     contrato.ponto_focal = ponto_focal
  //     contrato.cidade = cidade
  //     contrato.estado = estado
  //     contrato.objeto_contrato = objeto_contrato
  //     await contrato.save()

  //     // Atualiza os itens do contrato, se necessário
  //     if (items && items.length > 0) {
  //       await Promise.all(
  //         items.map(
  //           async (item: {
  //             id?: number
  //             titulo: string
  //             unidade_medida: string
  //             valor_unitario: string
  //             saldo_quantidade_contratada: string
  //           }) => {
  //             if (item.id) {
  //               // Atualiza item existente
  //               const contratoItem = await ContratoItem.find(item.id)
  //               if (contratoItem) {
  //                 contratoItem.titulo = item.titulo
  //                 contratoItem.unidade_medida = item.unidade_medida
  //                 contratoItem.valor_unitario = item.valor_unitario
  //                 contratoItem.saldo_quantidade_contratada = item.saldo_quantidade_contratada
  //                 await contratoItem.save()
  //               }
  //             } else {
  //               // Cria novo item
  //               await ContratoItem.create({
  //                 contrato_id: contrato.id,
  //                 titulo: item.titulo,
  //                 unidade_medida: item.unidade_medida,
  //                 valor_unitario: item.valor_unitario,
  //                 saldo_quantidade_contratada: item.saldo_quantidade_contratada,
  //               })
  //             }
  //           }
  //         )
  //       )
  //     }

  //     // Recarrega o contrato com os itens atualizados
  //     await contrato.load('contratoItens')

  //     return response.json(contrato)
  //   } catch (err) {
  //     console.error(err)
  //     return response.status(500).send('Erro no servidor')
  //   }
  // }
  async updateContract({ params, request, response }: HttpContext) {
    try {
      const data = request.only([
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
        'items',
      ]);

      const contrato = await Contrato.find(params.id);

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' });
      }

      // Atualiza apenas os campos presentes na requisição
      if (data.nome_contrato !== undefined) contrato.nome_contrato = data.nome_contrato;
      if (data.nome_cliente !== undefined) contrato.nome_cliente = data.nome_cliente;
      if (data.data_inicio !== undefined) contrato.data_inicio = data.data_inicio;
      if (data.data_fim !== undefined) contrato.data_fim = data.data_fim;
      if (data.lembrete_vencimento !== undefined) contrato.lembrete_vencimento = data.lembrete_vencimento;
      if (data.observacoes !== undefined) contrato.observacoes = data.observacoes;
      if (data.saldo_contrato !== undefined) contrato.saldo_contrato = data.saldo_contrato;
      if (data.ponto_focal !== undefined) contrato.ponto_focal = data.ponto_focal;
      if (data.cidade !== undefined) contrato.cidade = data.cidade;
      if (data.estado !== undefined) contrato.estado = data.estado;
      if (data.objeto_contrato !== undefined) contrato.objeto_contrato = data.objeto_contrato;

      // Atualiza o campo fiscal se ele estiver presente
      if (data.fiscal) {
        contrato.fiscal = {
          nome: data.fiscal.nome || contrato.fiscal?.nome,
          telefone: data.fiscal.telefone || contrato.fiscal?.telefone,
          email: data.fiscal.email || contrato.fiscal?.email,
        };
      }

      await contrato.save();

      // Atualiza os itens do contrato, se necessários, quando `items` está presente
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
                // Atualiza item existente
                const contratoItem = await ContratoItem.find(item.id);
                if (contratoItem) {
                  contratoItem.titulo = item.titulo;
                  contratoItem.unidade_medida = item.unidade_medida;
                  contratoItem.valor_unitario = item.valor_unitario;
                  contratoItem.saldo_quantidade_contratada = item.saldo_quantidade_contratada;
                  await contratoItem.save();
                }
              } else {
                // Cria novo item
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

      // Recarrega o contrato com os itens atualizados
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

      // Soft delete no contrato
      await contrato.merge({ deletedAt: DateTime.local() }).save()

      return response.status(202).json({ message: 'Contrato deletado com sucesso.' })
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
    }
  }

  async restoreContract({ params, response }: HttpContext) {
    try {
      const contratoId = params.id

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
