import { BaseSchema } from '@adonisjs/lucid/schema'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'lancamentos'
  async up() {
    const lancamentos = await Database.from('lancamentos').select('id', 'competencia')

    const meses = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ]

    for (const lancamento of lancamentos) {
      const competencia = lancamento.competencia?.toLowerCase()

      if (competencia) {
        const mesEncontrado = meses.find((mes) => competencia.includes(mes))

        if (mesEncontrado) {
          const date = DateTime.fromFormat(`2024-${mesEncontrado}`, 'yyyy-MMMM', {
            locale: 'pt-BR',
          })

          if (date.isValid) {
            await Database.from('lancamentos')
              .where('id', lancamento.id)
              .update({ competencia: date.toSQLDate() })
          } else {
            await Database.from('lancamentos')
              .where('id', lancamento.id)
              .update({ competencia: null })
          }
        } else {
          await Database.from('lancamentos')
            .where('id', lancamento.id)
            .update({ competencia: null })
        }
      } else {
        await Database.from('lancamentos').where('id', lancamento.id).update({ competencia: null })
      }
    }
  }

  async down() {
    const lancamentos = await Database.from('lancamentos').select('id', 'competencia')

    for (const lancamento of lancamentos) {
      const competencia = lancamento.competencia

      if (competencia) {
        const date = DateTime.fromSQL(competencia)
        if (date.isValid) {
          const formattedCompetencia = date.toFormat('MMMM', { locale: 'pt-BR' }).toUpperCase()

          await Database.from('lancamentos')
            .where('id', lancamento.id)
            .update({ competencia: formattedCompetencia })
        }
      }
    }
  }
}
