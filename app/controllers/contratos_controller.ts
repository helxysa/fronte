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
// import path from 'node:path'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import CurrentUserService from '#services/current_user_service'
import Logs from '#models/log'
import puppeteer from 'puppeteer';
import { Edge } from 'edge.js';
import Handlebars from 'handlebars';
import Projeto from '#models/projetos'

const edge = new Edge();
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const viewsPath = join(__dirname, '..', '..', 'resources', 'views')
edge.mount(viewsPath)

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
    const rawProjetos = request.input('projetos');
    const projetos = JSON.parse(rawProjetos);
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

      // Vincular projetos ao contrato
      if (Array.isArray(projetos)) {
        console.log('Array de projetos válido:', projetos);
        await Promise.all(
          projetos.map(async (projeto) => {
            await Projeto.create(
              {
                contrato_id: novoContrato.id,
                projeto: projeto.projeto,
                situacao: projeto.situacao,
                data_inicio: projeto.data_inicio,
                data_prevista: projeto.data_prevista,
                nome_dono_regra: projeto.nome_dono_regra,
                nome_gestor: projeto.nome_gestor,
                analista_responsavel: projeto.analista_responsavel,
              }
            )
          })
        )
      } else {
        console.log('Projetos não é um array:', projetos);
      }

      await novoContrato.load('projetos')

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
        .preload('projetos', (query) => {
          query.whereNull('deleted_at')
        })
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
          .preload('projetos', (query) => {
            query.whereNull('deleted_at')
          })
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
        .preload('projetos', (query) => {
          query.whereNull('deleted_at')
        })
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
      const dataInicio = request.input('dataInicio', null);
      const dataFim = request.input('dataFim', null);

      const hoje = DateTime.now().setLocale('pt-BR');
      const dataFimPeriodo = dataFim || DateTime.now();
      const dataInicioPeriodo = dataInicio || dataFimPeriodo.minus({ months: 6 });

      const contrato = await Contrato.query()
        .where('id', contratoId)
        .preload('contratoItens', (query) => {
          query.whereNull('deleted_at')
        })
        .preload('projetos', (query) => {
          query.whereNull('deleted_at')
        })
        .preload('lancamentos', (lancamentosQuery) => {
          lancamentosQuery
            .whereBetween('data_medicao', [dataInicioPeriodo, dataFimPeriodo])
            .if(filtroProjetos.length > 0, (query) => {
              query.whereIn('projetos', filtroProjetos);
            })
            .preload('lancamentoItens', (lancamentoItensQuery) => {
              lancamentoItensQuery.whereNull('deleted_at');
            });
        })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery
            .whereNull('deleted_at')
            .whereBetween('data_faturamento', [dataInicioPeriodo, dataFimPeriodo])
            .preload('faturamentoItens', (faturamentoItensQuery) => {
              faturamentoItensQuery.preload('lancamento', (lancamentoQuery) => {
                // lancamentoQuery.whereBetween('created_at', [dataInicioPeriodo, dataFimPeriodo]);
                lancamentoQuery.preload('lancamentoItens');
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

  async getRelatorioPdf({ params, request, response, auth }: HttpContext) {
    try {
      // Recebe os gráficos enviados
      const graficoBase64 = request.input('grafico', null);

      // Verifica se o gráfico foi enviado e converte para base64
      let graficoSrc = null;
      if (graficoBase64) {
        graficoSrc = graficoBase64; // O base64 pode ser usado diretamente no HTML
      }

      const usuarioAtual = auth.user || { nome: 'Usuário desconhecido' };
      const nomeUsuario = usuarioAtual.nome || 'Usuário desconhecido';
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
      const horaFormatada = dataAtual.toLocaleTimeString('pt-BR');

      //Lógica dos dados do PDF
      const contratoId = params.id;
      const filtroProjetos = request.input('projetos', []);

      // Reutiliza a lógica de getRelatorio para buscar e processar os dados
      const contrato = await Contrato.query()
        .where('id', contratoId)
        .preload('contratoItens')
        .preload('projetos', (query) => {
          query.whereNull('deleted_at')
        })
        .preload('lancamentos', (lancamentosQuery) => {
          lancamentosQuery
            .preload('lancamentoItens')
            .if(filtroProjetos.length > 0, (query) => {
              query.whereIn('projetos', filtroProjetos);
            });
        })
        .preload('faturamentos', (faturamentosQuery) => {
          faturamentosQuery
            .preload('faturamentoItens', (faturamentoItensQuery) => {
              faturamentoItensQuery.preload('lancamento', (lancamentoQuery) => {
                lancamentoQuery.preload('lancamentoItens');
              });
            });
        })
        .firstOrFail();

      const projetos = contrato.projetos.map((projeto) => ({
        id: projeto.id,
        nome: projeto.projeto,
      }));

      const saldoTotal = Number(contrato.saldo_contrato) || 0;
      let saldoAtual = saldoTotal;

      (contrato.lancamentos || []).forEach((lancamento) => {
        (lancamento.lancamentoItens || []).forEach((item) => {
          saldoAtual -= Number(item.valor_unitario) * Number(item.quantidade_itens);
        });
      });

      // Lógica de PDF ABAIXO

      const fileTemplate = path.resolve(
        __dirname,
        '..',
        '..',
        'resources',
        'views',
        'teste.hbs',
      );

      const templateFileContent = await fs.promises.readFile(fileTemplate, {
        encoding: 'utf-8',
      });

      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--enable-font-antialiasing',
          '--font-render-hinting=none',
          '--disable-web-security',
          '--disable-gpu',
          '--hide-scrollbars',
          '--disable-setuid-sandbox',
          '--force-color-profile=srgb',
        ],
      });

      const pagina = await browser.newPage();
      pagina.setDefaultNavigationTimeout(0)
      pagina.setDefaultTimeout(0)
      await pagina.setViewport({ width: 794, height: 1123 });

      await pagina.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36'
      );

      const parseTemplate = Handlebars.compile(templateFileContent);

      const dataContext = {
        contrato: {
          ...contrato.toJSON(),
          data_inicio: contrato.data_inicio.toFormat('dd/MM/yyyy'),
          data_fim: contrato.data_fim.toFormat('dd/MM/yyyy')
        },
        saldoTotal: formatCurrencySemArrendondar(saldoTotal),
        saldoAtual: formatCurrencySemArrendondar(saldoAtual),
        totalProjetos: projetos.length,
        contratoItens: contrato.contratoItens.map((item) => ({
          titulo: item.titulo,
          unidadeMedida: item.unidade_medida,
          saldo: formatCurrencySemArrendondar((Number.parseFloat(item.valor_unitario) * Number.parseFloat(item.saldo_quantidade_contratada))),
          quantidadeRestante: calcularItensRestante(item.id, item.saldo_quantidade_contratada, contrato.lancamentos),
        })),
        lancamentos: contrato.lancamentos.map((lanc) => ({
          dataMedicao: formatDate(lanc.data_medicao),
          projetos: lanc.projetos || '—',
          unidadeMedida: lanc.lancamentoItens[0]?.unidade_medida || 'N/A',
          medicao: lanc.lancamentoItens
            .reduce((total, subitem) => total + Number.parseFloat(subitem.quantidade_itens || "0"), 0)
            .toFixed(3),
        })),
        faturamentos: contrato.faturamentos.map((fat) => ({
          dataFaturamento: formatDate(fat.data_faturamento),
          competencia: formatCompetencia(fat.competencia),
          notaFiscal: fat.nota_fiscal || 'N/A',
          total: formatCurrencySemArrendondar(calcularSaldoFaturamentoItens(fat.faturamentoItens || [])),
          status: fat.status || '—',
        })),
        graficoSrc
      };

      const html = parseTemplate(dataContext);
      const filename = `${Date.now()}.pdf`;

      //Salva o pdf na maquina local
      const tmpFolder = path.resolve(__dirname, '..', '..', 'tmpPublic', 'uploads');
      const reportsFolder = path.resolve(tmpFolder, 'relatorios');
      const pathFile = `${reportsFolder}/${filename}`;

      await fs.promises.mkdir(reportsFolder, { recursive: true });

      await pagina.setContent(html, {
        timeout: 0
      });

      const logoEsquerdoPath = path.resolve(__dirname, '..', '..', 'resources', 'views', 'logos', 'logoMSB.png');
      const logoDireitoPath = path.resolve(__dirname, '..', '..', 'resources', 'views', 'logos', 'SeloCMMI.png');

      const logoBase64Esquerdo = fs.readFileSync(logoEsquerdoPath, 'base64');
      const logoBase64Direito = fs.readFileSync(logoDireitoPath, 'base64');

      await pagina.pdf({
        path: pathFile,
        landscape: false,
        printBackground: true,
        format: 'a4',
        displayHeaderFooter: true,
        timeout: 0,
        headerTemplate: `
           <div style="width: 100%; height:100%; display: flex; justify-content: space-between; align-items: center; font-size: 10px; margin-left: 50px; padding-bottom: 50px; box-sizing: border-box;">
            <img src="data:image/png;base64, ${logoBase64Esquerdo}" alt="Logo MSB" style="width: 150px; height: auto;" />
            <img src="data:image/png;base64, ${logoBase64Direito}" alt="Selo CMMI" style="width: 150px; height: auto;" />
          </div>
      `,
        footerTemplate: `<footer style="text-align: center; font-size: 10px; color: #666; margin-left: 30px;"> Usuário: ${nomeUsuario} Data: ${dataFormatada} Hora: ${horaFormatada} </footer>`,
        margin: { top: 150, bottom: 50, left: 10, right: 10 },
      });
      await browser.close();
      let url = `http://localhost:3333/files/relatorios/${filename}`;

      if (process.env.NODE_ENV === 'development') {
        url = `https://api-boss.msbtec.dev/files/relatorios/${filename}`;
      } else {
        url = `https://api-boss.msbtec.app/files/relatorios/${filename}`;
      }

      return response.send({ url });
    } catch (error) {
      const errorDetails = error.toJSON ? error.toJSON() : {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };

      return response.status(500).send({
        message: 'Erro ao gerar o PDF.',
        error: errorDetails,
      });
    }
  }

  async uploadChart({ request, response }: HttpContext) {
    const { image } = request.only(['image']); // Recebe a imagem base64

    // Remove o prefixo "data:image/png;base64," e converte para buffer
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Salva a imagem no disco (opcional)
    const tmpFolder = path.resolve(__dirname, '..', '..', 'tmpPublic', 'uploads', 'relatorios');
    const chartsFolder = path.resolve(tmpFolder, `chart-${Date.now()}.png`);
    fs.writeFileSync(chartsFolder, buffer);

    // Retorna sucesso
    return response.json({ success: true, chartsFolder });
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

// Função para formatar datas no formato dd/MM/yyyy
const formatDate = (isoString: any): string => {
  if (!isoString) {
    return 'Data inválida'; // Retorna um valor padrão caso seja null ou undefined
  }

  // Verifica se é um objeto Date
  if (isoString instanceof Date) {
    isoString = isoString.toISOString(); // Converte para formato ISO
  }

  // Verifica se é uma string válida
  if (typeof isoString !== 'string') {
    console.error('Formato de data inválido:', isoString);
    return 'Data inválida';
  }

  const [datePart] = isoString.split('T'); // Divide a data e hora
  const [ano, mes, dia] = datePart.split('-'); // Extrai partes da data
  return `${dia}/${mes}/${ano}`; // Retorna no formato dd/mm/yyyy
};

// Função para formatar mês e ano no formato "MMMM yyyy"
const formatCompetencia = (isoString: any) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
};

// Função para calcular o saldo total de faturamento itens
const calcularSaldoFaturamentoItens = (faturamentoItens: any[]) => {
  let saldoTotal = 0;
  faturamentoItens.forEach((faturamentoItem: any) => {
    const lancamento = faturamentoItem.lancamento;
    const lancamentoItens = lancamento.lancamentoItens || [];
    lancamentoItens.forEach((lancamentoItem: any) => {
      const valor = Number.parseFloat(lancamentoItem.valor_unitario || "0");
      const quantidade = Number.parseFloat(lancamentoItem.quantidade_itens || "0");
      const dias = lancamento.dias ? Number.parseFloat(lancamento.dias) : 0;
      if (dias > 0) {
        saldoTotal += (valor / 30) * dias;
      } else {
        saldoTotal += valor * quantidade;
      }
    });
  });

  return saldoTotal.toFixed(2);
};

// Função para calcular a quantidade restante de itens
const calcularItensRestante = (idItem: number, quantidadeContratada: string | number, lancamentos: any[]): string => {
  let quantidadeUtilizada = 0;

  lancamentos.forEach((lancamento) => {
    if (["Autorizada", "Não Autorizada", "Cancelada", "Não Iniciada", "Em Andamento"].includes(lancamento.status)) {
      return;
    }

    // Somar as quantidades dos itens correspondentes ao idItem
    lancamento.lancamentoItens.forEach((lancamentoItem: any) => {
      if (lancamentoItem.contrato_item_id === idItem) {
        quantidadeUtilizada += Number.parseFloat(lancamentoItem.quantidade_itens || "0");
      }
    });
  });

  // Calcular quantidade restante
  const quantidadeContratadaNumerica = Number.parseFloat(String(quantidadeContratada)) || 0;
  const quantidadeRestante = quantidadeContratadaNumerica - quantidadeUtilizada;

  // Retornar com três casas decimais
  // return quantidadeRestante.toFixed(3);
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(quantidadeRestante);
};


const formatCurrencySemArrendondar = (value: any) => {
  const [parteInteira, parteDecimal] = value.toString().split('.');
  const inteiroFormatado = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalFormatado = (parteDecimal || '00').substring(0, 2).padEnd(2, '0');
  return `${inteiroFormatado},${decimalFormatado}`;
};
