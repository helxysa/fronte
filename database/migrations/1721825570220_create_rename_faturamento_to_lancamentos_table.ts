import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.renameTable('faturamentos', 'lancamentos')
    this.schema.renameTable('faturamento_itens', 'lancamento_itens')
  }

  async down() {
    this.schema.renameTable('lancamentos', 'faturamentos')
    this.schema.renameTable('lancamento_itens', 'faturamento_itens')
  }
}
