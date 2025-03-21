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

      // Buscar férias já gozadas
      const feriasGozadas = await RelatorioFerias.query()
        .where('contratoId', contratoId)
        .orderBy('periodoGozoInicio', 'desc')

      // Calcular total de dias já gozados
      let totalDiasGozados = 0
      if (feriasGozadas.length > 0) {
        totalDiasGozados = feriasGozadas.reduce((total, ferias) => {
          return total + ferias.diasGozados
        }, 0)
      }

      // Encontrar o período disponível
      const periodoDisponivel = periodos.find(p => p.status === 'disponivel')
      
      // Calcular dias disponíveis com base no período aquisitivo
      // Se o período aquisitivo tem 30 dias (1 ano) ou 15 dias (6 meses)
      let diasDisponiveis = 0
      if (periodoDisponivel) {
        diasDisponiveis = Math.max(0, periodoDisponivel.diasDisponiveis - totalDiasGozados)
        
        // Atualizar dias disponíveis no período
        periodoDisponivel.diasDisponiveis = diasDisponiveis
      }
      
      // Garantir que a resposta inclua explicitamente o diasDisponiveis e diasGozados
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

    // Calcular meses desde a admissão
    const mesesDesdeAdmissao = hoje.diff(dataAdmissao, 'months').months

    // Período aquisitivo - começa na data de admissão e vai até hoje
    // Determinar status e dias disponíveis
    let statusAquisitivo: 'em_andamento' | 'disponivel' | 'vencido' = 'em_andamento'
    let diasDisponiveisAquisitivo = 0

    // Lógica corrigida para período aquisitivo
    if (mesesDesdeAdmissao >= 12) {
      // 12 meses ou mais = 30 dias de férias
      statusAquisitivo = 'disponivel'
      diasDisponiveisAquisitivo = 30
    } else if (mesesDesdeAdmissao >= 6 && mesesDesdeAdmissao < 12) {
      // Entre 6 e 12 meses = 15 dias de férias
      statusAquisitivo = 'disponivel'
      diasDisponiveisAquisitivo = 15
    } else {
      // Menos de 6 meses = em andamento, sem férias disponíveis
      statusAquisitivo = 'em_andamento'
      diasDisponiveisAquisitivo = 0
    }

    // Adicionar período aquisitivo - da data de admissão até hoje
    periodos.push({
      inicio: dataAdmissao,
      fim: hoje,  // Corrigido: fim é a data atual, não um ano após a admissão
      tipo: 'aquisitivo',
      diasDisponiveis: diasDisponiveisAquisitivo,
      status: statusAquisitivo,
    })

    // Se já completou 12 meses, calcular período concessivo
    if (mesesDesdeAdmissao >= 12) {
      const inicioPeriodoConcessivo = dataAdmissao.plus({ years: 1 })
      const fimPeriodoConcessivo = inicioPeriodoConcessivo.plus({ years: 1 }).minus({ days: 1 })

      let statusConcessivo: 'em_andamento' | 'disponivel' | 'vencido' = 'em_andamento'

      // Verificar se o período concessivo já venceu
      if (hoje > fimPeriodoConcessivo) {
        statusConcessivo = 'vencido'
      } else {
        statusConcessivo = 'em_andamento'
      }

      periodos.push({
        inicio: inicioPeriodoConcessivo,
        fim: fimPeriodoConcessivo,
        tipo: 'concessivo',
        diasDisponiveis: 30, // Sempre 30 dias no período concessivo
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

      // Converter a data de admissão para DateTime do Luxon
      const dataAdmissao = DateTime.fromISO(contrato.dataAdmissao.toString())
      
      // Calcular períodos aquisitivos e concessivos
      const periodos = this.calcularPeriodos(dataAdmissao)
      
      // Encontrar o período disponível (com status 'disponivel')
      const periodoDisponivel = periodos.find(p => p.status === 'disponivel')
      
      if (!periodoDisponivel) {
        return response.status(400).json({
          message: 'Funcionário não possui períodos de férias disponíveis',
          periodos: periodos,
          diasDisponiveis: 0,
        })
      }
      
      // Buscar férias já gozadas
      const feriasGozadas = await RelatorioFerias.query()
        .where('contratoId', dados.contratoId)
        .orderBy('periodoGozoInicio', 'desc')
      
      // Calcular total de dias já gozados
      let totalDiasGozados = 0
      if (feriasGozadas.length > 0) {
        totalDiasGozados = feriasGozadas.reduce((total, ferias) => {
          return total + ferias.diasGozados
        }, 0)
      }
      
      // Calcular dias disponíveis com base no período aquisitivo
      // Se o período aquisitivo tem 30 dias (1 ano) ou 15 dias (6 meses)
      const diasTotais = periodoDisponivel.diasDisponiveis
      const diasDisponiveis = Math.max(0, diasTotais - totalDiasGozados)
      
      // Calcular dias solicitados
      const diasSolicitados = Math.ceil(
        DateTime.fromISO(dados.periodoGozoFim).diff(
          DateTime.fromISO(dados.periodoGozoInicio),
          'days'
        ).days
      ) + 1
      
      console.log('Dias solicitados:', diasSolicitados)
      console.log('Dias disponíveis:', diasDisponiveis)
      
      // Verificar se há dias suficientes disponíveis
      if (diasSolicitados > diasDisponiveis) {
        return response.status(400).json({
          message: `Dias solicitados (${diasSolicitados}) maior que dias disponíveis (${diasDisponiveis})`,
          periodoDisponivel,
          diasDisponiveis,
        })
      }
      
      const dataRetorno = DateTime.fromISO(dados.periodoGozoFim).plus({ days: 1 })
      
      // Calcular saldo atual após esta solicitação
      const saldoFeriasAtual = diasDisponiveis - diasSolicitados
      
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
        abonoPecuniario: dados.abonoPecuniario || false,
        diasAbono: dados.diasAbono || 0,
        valorAbono: dados.valorAbono || 0,
        observacoes: dados.observacoes || '',
        // Campos de controle de saldo
        diasGozados: diasSolicitados,
        saldoFeriasAnterior: diasDisponiveis,
        saldoFeriasAtual: saldoFeriasAtual
      })
      
      await relatorio.load('contrato')
      
      return response.created({
        message: 'Relatório de férias criado com sucesso',
        relatorio,
        periodoUtilizado: periodoDisponivel,
        diasSolicitados,
        diasGozados: totalDiasGozados + diasSolicitados,
        saldoFeriasAnterior: diasDisponiveis,
        saldoFeriasAtual: saldoFeriasAtual
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
