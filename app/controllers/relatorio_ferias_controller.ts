import { HttpContext } from '@adonisjs/core/http'
import RelatorioFerias from '#models/relatorio_ferias'
import Contratoclt from '#models/contratoclt'
import { DateTime } from 'luxon'

interface PeriodoFerias {
  inicio: DateTime
  fim: DateTime
  tipo: 'aquisitivo' | 'concessivo'
  diasDisponiveis: number
  status: 'em_andamento' | 'disponivel' | 'vencido'
}

export default class RelatorioFeriasController {
  async historicoByContrato({ params, response }: HttpContext) {
    try {
      const { contratoId } = params

      // Buscar o contrato para obter a data de admissão
      const contrato = await Contratoclt.find(contratoId)

      if (!contrato) {
        return response.status(404).json({ message: 'Contrato não encontrado' })
      }

      // Verificar se a data de admissão existe
      if (!contrato.dataAdmissao) {
        return response
          .status(400)
          .json({ message: 'Data de admissão não encontrada para este contrato' })
      }

      // Converter a data de admissão para DateTime do Luxon
      const dataAdmissao = DateTime.fromISO(contrato.dataAdmissao.toString())

      // Calcular períodos aquisitivos e concessivos
      const periodos = this.calcularPeriodos(dataAdmissao)

      // Buscar dias já gozados
      const feriasGozadas = await RelatorioFerias.query()
        .where('contratoId', contratoId)
        .orderBy('periodoGozoInicio', 'desc')

      // Calcular total de dias já gozados
      let totalDiasGozados = 0
      if (feriasGozadas.length > 0) {
        totalDiasGozados = feriasGozadas.reduce((total, ferias) => {
          const inicio = DateTime.fromISO(ferias.periodoGozoInicio.toString())
          const fim = DateTime.fromISO(ferias.periodoGozoFim.toString())
          const dias = Math.ceil(fim.diff(inicio, 'days').days) + 1
          return total + dias
        }, 0)
      }

      // Calcular dias disponíveis (máximo 30 dias)
      const diasDisponiveis = Math.max(0, 30 - totalDiasGozados)

      // Atualizar dias disponíveis nos períodos
      let diasDisponiveisRestantes = diasDisponiveis
      for (const periodo of periodos) {
        if (periodo.status === 'disponivel') {
          // Atribuir os dias disponíveis restantes a este período
          periodo.diasDisponiveis = diasDisponiveisRestantes
          break // Atribuir apenas ao primeiro período disponível
        }
      }

      return response.json({
        periodos,
        diasGozados: totalDiasGozados,
        diasDisponiveis,
        periodosGozados: feriasGozadas,
      })
    } catch (error) {
      console.error('Erro detalhado:', error)
      return response.status(500).json({
        message: 'Erro ao buscar histórico de férias',
        error: error.message,
      })
    }
  }

  private calcularPeriodos(dataAdmissao: DateTime): PeriodoFerias[] {
    const hoje = DateTime.now()
    const periodos: PeriodoFerias[] = []

    // Calcular dias desde a admissão
    const diasDesdeAdmissao = Math.floor(hoje.diff(dataAdmissao, 'days').days)

    // Período aquisitivo (primeiro ano)
    const fimPeriodoAquisitivo = dataAdmissao.plus({ years: 1 }).minus({ days: 1 })

    // Determinar status e dias disponíveis
    let statusAquisitivo: 'em_andamento' | 'disponivel' | 'vencido' = 'em_andamento'
    let diasDisponiveisAquisitivo = 0

    if (hoje > fimPeriodoAquisitivo) {
      statusAquisitivo = 'disponivel'
      diasDisponiveisAquisitivo = 30 // Máximo de 30 dias após 1 ano
    } else {
      // Verificar se já tem pelo menos 6 meses
      const mesesDecorridos = hoje.diff(dataAdmissao, 'months').months

      if (mesesDecorridos >= 6) {
        statusAquisitivo = 'disponivel'
        diasDisponiveisAquisitivo = 15 // 15 dias após 6 meses
      }
    }

    // Adicionar período aquisitivo
    periodos.push({
      inicio: dataAdmissao,
      fim: fimPeriodoAquisitivo,
      tipo: 'aquisitivo',
      diasDisponiveis: diasDisponiveisAquisitivo,
      status: statusAquisitivo,
    })

    // Se já passou do primeiro ano, calcular período concessivo
    if (diasDesdeAdmissao > 365) {
      const inicioPeriodoConcessivo = fimPeriodoAquisitivo.plus({ days: 1 })
      const fimPeriodoConcessivo = inicioPeriodoConcessivo.plus({ years: 1 }).minus({ days: 1 })

      let statusConcessivo: 'em_andamento' | 'disponivel' | 'vencido' = 'em_andamento'
      let diasDisponiveisConcessivo = 0

      if (hoje > fimPeriodoConcessivo) {
        statusConcessivo = 'vencido'
      } else {
        statusConcessivo = 'disponivel'
        diasDisponiveisConcessivo = 30 // Sempre 30 dias no período concessivo
      }

      periodos.push({
        inicio: inicioPeriodoConcessivo,
        fim: fimPeriodoConcessivo,
        tipo: 'concessivo',
        diasDisponiveis: diasDisponiveisConcessivo,
        status: statusConcessivo,
      })
    }

    return periodos
  }

  async index({ response }: HttpContext) {
    try {
      const relatorios = await RelatorioFerias.query().preload('contrato')
      return response.ok(relatorios)
    } catch (error) {
      return response.status(500).json({
        message: 'Erro ao listar relatórios de férias',
        error: error.message,
      })
    }
  }

  async store({ request, response }: HttpContext) {
    try {
      const dados = request.only([
        'contratoId',
        'periodoGozoInicio',
        'periodoGozoFim',
        'abonoPecuniario',
        'diasAbono',
        'valorAbono',
        'observacoes',
      ])

      // Verifica se o contrato existe
      const contrato = await Contratoclt.find(dados.contratoId)
      if (!contrato) {
        return response.status(404).json({
          message: `Contrato CLT com ID ${dados.contratoId} não encontrado`,
        })
      }

      if (!contrato.dataAdmissao) {
        return response.status(400).json({
          message: 'Data de admissão não encontrada para este contrato',
        })
      }

      const periodos = this.calcularPeriodos(DateTime.fromISO(contrato.dataAdmissao.toISO()))

      const periodoDisponivel = periodos.find(
        (p) => p.status === 'disponivel' && p.diasDisponiveis > 0
      )

      if (!periodoDisponivel) {
        return response.status(400).json({
          message: 'Funcionário não possui períodos de férias disponíveis',
          periodos: periodos,
        })
      }

      const diasSolicitados =
        DateTime.fromISO(dados.periodoGozoFim).diff(
          DateTime.fromISO(dados.periodoGozoInicio),
          'days'
        ).days + 1

      if (diasSolicitados > periodoDisponivel.diasDisponiveis) {
        return response.status(400).json({
          message: `Dias solicitados (${diasSolicitados}) maior que dias disponíveis (${periodoDisponivel.diasDisponiveis})`,
          periodoDisponivel,
        })
      }

      const dataRetorno = DateTime.fromISO(dados.periodoGozoFim).plus({ days: 1 })

      const relatorio = await RelatorioFerias.create({
        contratoId: dados.contratoId,
        nome: contrato.nomeCompleto,
        cargo: contrato.cargo,
        setor: contrato.departamento,
        periodoAquisitivoInicio: periodoDisponivel.inicio,
        periodoAquisitivoFim: periodoDisponivel.fim,
        periodoGozoInicio: dados.periodoGozoInicio,
        periodoGozoFim: dados.periodoGozoFim,
        dataRetorno,
        abonoPecuniario: dados.abonoPecuniario,
        diasAbono: dados.diasAbono,
        valorAbono: dados.valorAbono,
        observacoes: dados.observacoes,
      })

      await relatorio.load('contrato')

      return response.created({
        message: 'Relatório de férias criado com sucesso',
        relatorio,
        periodoUtilizado: periodoDisponivel,
      })
    } catch (error) {
      console.error('Erro detalhado:', error)
      return response.status(500).json({
        message: 'Erro ao criar relatório de férias',
        error: error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const relatorio = await RelatorioFerias.findOrFail(params.id)
      await relatorio.load('contrato')
      return response.ok(relatorio)
    } catch (error) {
      return response.status(404).json({
        message: 'Relatório de férias não encontrado',
        error: error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const relatorio = await RelatorioFerias.findOrFail(params.id)
      const dados = request.only([
        'periodoAquisitivoInicio',
        'periodoAquisitivoFim',
        'periodoGozoInicio',
        'periodoGozoFim',
        'dataRetorno',
        'abonoPecuniario',
        'diasAbono',
        'valorAbono',
        'observacoes',
      ])

      if (dados.periodoAquisitivoInicio) {
        dados.periodoAquisitivoInicio = DateTime.fromISO(dados.periodoAquisitivoInicio)
      }
      if (dados.periodoAquisitivoFim) {
        dados.periodoAquisitivoFim = DateTime.fromISO(dados.periodoAquisitivoFim)
      }
      if (dados.periodoGozoInicio) {
        dados.periodoGozoInicio = DateTime.fromISO(dados.periodoGozoInicio)
      }
      if (dados.periodoGozoFim) {
        dados.periodoGozoFim = DateTime.fromISO(dados.periodoGozoFim)
      }
      if (dados.dataRetorno) {
        dados.dataRetorno = DateTime.fromISO(dados.dataRetorno)
      }

      await relatorio.merge(dados).save()
      return response.ok(relatorio)
    } catch (error) {
      return response.status(500).json({
        message: 'Erro ao atualizar relatório de férias',
        error: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const relatorio = await RelatorioFerias.findOrFail(params.id)
      await relatorio.delete()
      return response.ok({ message: 'Relatório de férias excluído com sucesso' })
    } catch (error) {
      return response.status(500).json({
        message: 'Erro ao excluir relatório de férias',
        error: error.message,
      })
    }
  }
}
