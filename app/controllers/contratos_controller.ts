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

  async getContracts({ response }: HttpContext) {
    try {
      const contratos = await this.fetchContracts()
      return response.json(contratos)
    } catch (err) {
      console.error(err)
      response.status(500).send('Server error')
    }
  }

  private async fetchContracts() {
    try {
      const contratos = await Contrato.query()
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
        .exec()

      return contratos
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
        .preload('renovacao', (query) => {
          query.whereNull('deleted_at')
          query.preload('contratoItens', (contratoItensQuery) => {
            contratoItensQuery.whereNull('deleted_at')
          })
          query.preload('lancamentos', (lancamentoQuery) => {
            lancamentoQuery.whereNull('deleted_at')
            lancamentoQuery.preload('lancamentoItens', (lancamentoItensQuery) => {
              lancamentoItensQuery.whereNull('deleted_at')
            })
          })
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

  async updateContract({ params, request, response }: HttpContext) {
    try {
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

      const contrato = await Contrato.find(params.id)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      contrato.nome_contrato = nome_contrato
      contrato.nome_cliente = nome_cliente
      contrato.data_inicio = data_inicio
      contrato.data_fim = data_fim
      contrato.lembrete_vencimento = lembrete_vencimento
      contrato.observacoes = observacoes
      contrato.saldo_contrato = saldo_contrato
      contrato.fiscal = { nome, telefone, email }
      contrato.ponto_focal = ponto_focal
      contrato.cidade = cidade
      contrato.estado = estado
      contrato.objeto_contrato = objeto_contrato
      await contrato.save()

      // Atualiza os itens do contrato, se necessário
      if (items && items.length > 0) {
        await Promise.all(
          items.map(
            async (item: {
              id?: number
              titulo: string
              unidade_medida: string
              valor_unitario: string
              saldo_quantidade_contratada: string
            }) => {
              if (item.id) {
                // Atualiza item existente
                const contratoItem = await ContratoItem.find(item.id)
                if (contratoItem) {
                  contratoItem.titulo = item.titulo
                  contratoItem.unidade_medida = item.unidade_medida
                  contratoItem.valor_unitario = item.valor_unitario
                  contratoItem.saldo_quantidade_contratada = item.saldo_quantidade_contratada
                  await contratoItem.save()
                }
              } else {
                // Cria novo item
                await ContratoItem.create({
                  contrato_id: contrato.id,
                  titulo: item.titulo,
                  unidade_medida: item.unidade_medida,
                  valor_unitario: item.valor_unitario,
                  saldo_quantidade_contratada: item.saldo_quantidade_contratada,
                })
              }
            }
          )
        )
      }

      // Recarrega o contrato com os itens atualizados
      await contrato.load('contratoItens')

      return response.json(contrato)
    } catch (err) {
      console.error(err)
      return response.status(500).send('Erro no servidor')
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
  async getDashboard({ response }: HttpContext) {
    const contratos = await this.fetchContracts()
    const { stampTotalAguardandoFaturamento, stampTotalAguardandoPagamento, stampTotalPago, totalUtilizado } = await this.getStampData(contratos)

    const stampTotalValorContratado = contratos.reduce((acc, contrato) => {
      const saldo = Number(contrato.saldo_contrato) || 0
      return acc + saldo
    }, 0)

    const top5 = await this.getTop5Contratos(contratos);

    const contratosPorVencimentoMap: any = {};

    contratos.forEach(contrato => {
      const lembreteVencimento = contrato.lembrete_vencimento;
      const idContrato = contrato.id;

      if (lembreteVencimento) {
        if (!contratosPorVencimentoMap[lembreteVencimento]) {
          contratosPorVencimentoMap[lembreteVencimento] = { qtd_contratos: 0, id_contratos: [] };
        }
        const current = contratosPorVencimentoMap[lembreteVencimento];
        current.qtd_contratos++;
        current.id_contratos.push(idContrato);
      }
    });

    const contratos_por_vencimento = Object.keys(contratosPorVencimentoMap).map(lembrete_vencimento => {
      const { qtd_contratos, id_contratos } = contratosPorVencimentoMap[lembrete_vencimento];
      return {
        lembrete_vencimento,
        qtd_contratos,
        id_contratos: id_contratos.join(',')
      };
    });

    const cidadeDataMap: { [cidade: string]: { total: number, latitude: string | null, longitude: string | null } } = {};

    for (const contrato of contratos) {
      const cidade = contrato.cidade;
      const estado = contrato.estado;
      const valorContratado = Number(contrato.saldo_contrato) || 0;

      if (!cidadeDataMap[`${cidade}, ${estado}`]) {
        const locationData = await getLocationData(cidade, estado);
        cidadeDataMap[`${cidade}, ${estado}`] = {
          total: 0,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        };
      }

      cidadeDataMap[`${cidade}, ${estado}`].total += valorContratado;
    }

    const map = Object.keys(cidadeDataMap).map(cidadeEstado => {
      const [cidade, estado] = cidadeEstado.split(', ');
      return {
        cidade: cidade,
        estado: estado,
        latitude: cidadeDataMap[cidadeEstado].latitude,
        longitude: cidadeDataMap[cidadeEstado].longitude,
        valor_total: cidadeDataMap[cidadeEstado].total,
      };
    });

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
      map, // id contrato, cidade, latitude e a longitude, soma do valor contratado total por cidade
      contratos: contratos,
    })
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
}
const REQUEST_INTERVAL = 2000; // 2000 ms = 2 segundos
const queue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (queue.length > 0) {
    const task = queue.shift();
    if (task) {
      await task();
      await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
    }
  }

  isProcessingQueue = false;
}

async function getLocationData(cidade: string, estado: string): Promise<{ latitude: string | null; longitude: string | null }> {
  try {
    // Verifica se a combinação cidade e estado já existe no banco de dados usando o modelo Cidade
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

    // Se não existir, faz a requisição ao Nominatim
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${cidade}, ${estado}`,
        format: 'json',
        addressdetails: 1,
      },
    });
    console.log(res);
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
