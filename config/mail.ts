// import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    smtp: transports.smtp({
      host: 'smtp-relay.brevo.com',
      port: '587',
      secure: false,
      auth: {
        type: 'login',
        user: 'monitoramento.msb@gmail.com',
        pass: 'jg47MHnhcpvQGLIa',
      },
      /**
       * Uncomment the auth block if your SMTP
       * server needs authentication
       */
      /* auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME'),
        pass: env.get('SMTP_PASSWORD'),
      }, */
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  // eslint-disable-next-line prettier/prettier
  export interface MailersList extends InferMailers<typeof mailConfig> { }
}
