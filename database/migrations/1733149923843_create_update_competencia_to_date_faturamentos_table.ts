import { BaseSchema } from '@adonisjs/lucid/schema'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class extends BaseSchema {
  protected tableName = 'faturamentos'

  async up() {
    // 1. Tratar os valores existentes na coluna `competencia`
    const registros = await Database.from(this.tableName).select('id', 'competencia')

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

    for (const registro of registros) {
      const competencia = registro.competencia?.toLowerCase()

      if (competencia) {
        const mesEncontrado = meses.find((mes) => competencia.includes(mes))

        if (mesEncontrado) {
          const date = DateTime.fromFormat(`2024-${mesEncontrado}`, 'yyyy-MMMM', {
            locale: 'pt-BR',
          })

          if (date.isValid) {
            await Database.from(this.tableName)
              .where('id', registro.id)
              .update({ competencia: date.toSQLDate() })
          } else {
            await Database.from(this.tableName)
              .where('id', registro.id)
              .update({ competencia: null })
          }
        } else {
          await Database.from(this.tableName).where('id', registro.id).update({ competencia: null })
        }
      } else {
        await Database.from(this.tableName).where('id', registro.id).update({ competencia: null })
      }
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.date('competencia').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('competencia').alter()
    })

    const registros = await Database.from(this.tableName).select('id', 'competencia')
    for (const registro of registros) {
      const competencia = registro.competencia

      if (competencia) {
        const date = DateTime.fromSQL(competencia)
        if (date.isValid) {
          const formattedCompetencia = date.toFormat('MMMM yyyy', { locale: 'pt-BR' }).toUpperCase()

          await Database.from(this.tableName)
            .where('id', registro.id)
            .update({ competencia: formattedCompetencia })
        }
      }
    }
  }
}
