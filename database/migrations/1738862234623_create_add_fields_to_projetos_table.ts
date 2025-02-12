import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projetos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('situacao', [
          'Aguardando Autorização',
          'Em Desenvolvimento',
          'Em Sustentação',
          'Parado',
          'Finalizado',
        ])
        .nullable()

      table.date('data_inicio').nullable()
      table.date('data_prevista').nullable()
      table.string('nome_dono_regra').nullable()
      table.string('nome_gestor').nullable()
      table.string('analista_responsavel').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('situacao')
      table.dropColumn('data_inicio')
      table.dropColumn('data_prevista')
      table.dropColumn('nome_dono_regra')
      table.dropColumn('nome_gestor')
      table.dropColumn('analista_responsavel')
    })
  }
}
