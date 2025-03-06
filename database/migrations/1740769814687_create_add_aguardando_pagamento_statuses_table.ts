import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'relatorio_mensais'

  async up() {
    // Armazenar os valores atuais antes de remover a coluna
    const registros = await this.db.from(this.tableName).select('id', 'status')

    // Remover a coluna status existente
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })

    // Recriar a coluna com os valores permitidos atualizados, incluindo 'aguardando_pagamento'
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('status', ['pendente', 'disponivel_pagamento', 'aguardando_pagamento', 'pago'])
        .notNullable()
        .defaultTo('pendente')
    })

    // Restaurar os valores originais
    for (const registro of registros) {
      await this.db
        .from(this.tableName)
        .where('id', registro.id)
        .update({ status: registro.status })
    }
  }

  async down() {
    // Converter quaisquer valores 'aguardando_pagamento' para 'disponivel_pagamento'
    await this.db
      .from(this.tableName)
      .where('status', 'aguardando_pagamento')
      .update({ status: 'disponivel_pagamento' })

    // Armazenar os valores atuais antes de remover a coluna
    const registros = await this.db.from(this.tableName).select('id', 'status')

    // Remover a coluna status
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })

    // Recriar a coluna apenas com os valores originais
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('status', ['pendente', 'disponivel_pagamento', 'pago'])
        .notNullable()
        .defaultTo('pendente')
    })

    // Restaurar os valores
    for (const registro of registros) {
      // Ignorar os registros que tinham status 'aguardando_pagamento'
      if (registro.status !== 'aguardando_pagamento') {
        await this.db
          .from(this.tableName)
          .where('id', registro.id)
          .update({ status: registro.status })
      }
    }
  }
}
