/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable prettier/prettier */
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { json } from 'node:stream/consumers'
const RelatorioFeriasController = () => import('#controllers/relatorio_ferias_controller')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LogsController = () => import('#controllers/logs_controller')
const UsersController = () => import('#controllers/users_controller')
const AuthController = () => import('#controllers/auth_controller')
const ProfilesController = () => import('#controllers/profiles_controller')
const ContratosController = () => import('#controllers/contratos_controller')
// const RenovacaoController = () => import('#controllers/renovacao_controller')
const ContratoItemController = () => import('#controllers/contrato_item_controller')
const LancamentosController = () => import('#controllers/lancamentos_controller')
const FaturamentosController = () => import('#controllers/faturamentos_controller')
const UnidadeMedidaController = () => import('#controllers/unidade_medida_controller')
const ProjetosController = () => import('#controllers/projetos_controller')
const ContratoAnexosController = () => import('#controllers/contrato_anexos_controller')
const MedicaoAnexosController = () => import('#controllers/medicao_anexos_controller')
const FaturamentoAnexosController = () => import('#controllers/faturamento_anexos_controller')
const ContratoPjAnexosController = () => import('#controllers/contrato_pj_anexos_controller')
// const TermoAditivosController = () => import('#controllers/termo_aditivos_controller')
// const TermoAditivoItemsController = () => import('#controllers/termo_aditivo_items_controller')
const TermoAditivoAnexosController = () => import('#controllers/termo_aditivo_anexos_controller')
const ContratoPjController = () => import('#controllers/contrato_pjs_controller')
const RelatorioMensaisController = () => import('#controllers/relatorio_mensais_controller')
const ContratoCltsController = () => import('#controllers/contrato_clts_controller')
const PagamentosController = () => import('#controllers/pagamentos_controller')
// Registro, Login e Autenticação
router.post('/register', [AuthController, 'register']).as('auth.register')
router.post('/login', [AuthController, 'login']).as('auth.login')
router.put('users/reset-password', [AuthController, 'resetPasswordByAdministrator'])
router.delete('/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
router.get('/me', [AuthController, 'me']).as('auth.me')
// Usuários
router.get('users', [UsersController, 'index'])
router.get('users/:id', [UsersController, 'show'])
router.post('users', [UsersController, 'store'])
router.put('users/email/:id', [UsersController, 'updateEmail'])
router.put('users/update/:id', [UsersController, 'updateUsuario'])
router.put('users/alterar-senha/:id', [UsersController, 'updatePassword'])
router.put('users/esqueci-minha-senha', [UsersController, 'forgotPassword'])
router.put('users/:id/perfil', [UsersController, 'setUserProfile'])
router.post('users/esqueci-minha-senha', [UsersController, 'resetPassword'])
router.put('/users/:id/passwordChanged', [UsersController, 'updatePasswordChangedStatus'])
router.delete('users/:id', [UsersController, 'destroy'])
router.get('files/:filename', async ({ params, response }) => {
  try {
    const filePath = path.join(__dirname, '..', 'tmpPublic', 'uploads', params.filename)
    return response.attachment(filePath, params.filename)
  } catch (error) {
    console.error('Erro ao servir o arquivo:', error)
    return response.status(500).send('Erro ao acessar o arquivo.')
  }
})
router.get('files/relatorios/:filename', async ({ params, response }) => {
  try {
    const filePath = path.join(
      __dirname,
      '..',
      'tmpPublic',
      'uploads',
      'relatorios',
      params.filename
    )
    return response.attachment(filePath, params.filename)
  } catch (error) {
    console.error('Erro ao servir o arquivo:', error)
    return response.status(500).send('Erro ao acessar o arquivo.')
  }
})
router.post('upload/chart', [ContratosController, 'uploadChart'])
// Perfis e Permissões
router
  .group(() => {
    router.get('perfil', [ProfilesController, 'index'])
    router.get('perfil/:id', [ProfilesController, 'show'])
    router.post('perfil', [ProfilesController, 'store'])
    router.put('perfil/:id', [ProfilesController, 'update'])
    router.delete('perfil/:id', [ProfilesController, 'destroy'])
  })
  
// Dashboard
router
  .group(() => {
    router.get('/dashboard', [ContratosController, 'getDashboard'])
  })
  .use(middleware.auth())
// Contratos
router
  .group(() => {
    router.post('/contratos', [ContratosController, 'createContract'])
    router.get('/contratos-e-termos', [ContratosController, 'getContractAndAditiveTerms'])
    router.get('/contratos', [ContratosController, 'getContracts'])
    router.get('/contratos/:id', [ContratosController, 'getContractById'])
    router.post('/contratos/:id/relatorio/', [ContratosController, 'getRelatorio'])
    router.post('/contratos/:id/relatorio/pdf', [ContratosController, 'getRelatorioPdf'])
    router.put('/contratos/:id', [ContratosController, 'updateContract'])
    router.put('/contratos/restore/:id', [ContratosController, 'restoreContract'])
    router.delete('/contratos/:id', [ContratosController, 'deleteContract'])
    // Contrato foto
    router.post('/contratos/:id/foto', [ContratosController, 'uploadFoto'])
  })
  .use(middleware.auth())

// Contrato PJ ContratoPjController
router.post('/contrato/pj', [ContratoPjController, 'createContractPJ'])
router.get('/contrato/pj', [ContratoPjController, 'index'])
router.get('/contrato/pj/:id', [ContratoPjController, 'showContractPJ'])
router.put('/contrato/pj/:id', [ContratoPjController, 'updateContractPJ'])
router.put('/contrato/pj/:id/restore', [ContratoPjController, 'restoreContractPJ'])
router.delete('/contrato/pj/:id', [ContratoPjController, 'deleteContractPJ'])
router
  .get('/contrato-pj/ativo', [ContratoPjController, 'getActiveContractByUser'])
  .use(middleware.auth())

// Contrato Anexos
router.post('/contratos/:contrato_id/anexos', [ContratoAnexosController, 'store'])
router.get('/contratos/:contrato_id/anexos', [ContratoAnexosController, 'index'])
router.get('/contratos/:contrato_id/anexos/:id', [ContratoAnexosController, 'show'])
router.put('/contratos/:contrato_id/anexos/:id', [ContratoAnexosController, 'update'])
router.delete('/contratos/anexos/:id', [ContratoAnexosController, 'destroy'])
// Termo Aditivo Anexos
router.post('/aditivo/:termo_aditivo_id/anexos', [TermoAditivoAnexosController, 'store'])
router.get('/aditivo/:termo_aditivo_id/anexos', [TermoAditivoAnexosController, 'index'])
router.get('/aditivo/:termo_aditivo_id/anexos/:id', [TermoAditivoAnexosController, 'show'])
router.put('/aditivo/:termo_aditivo_id/anexos/:id', [TermoAditivoAnexosController, 'update'])
router.delete('/aditivo/anexos/:id', [TermoAditivoAnexosController, 'destroy'])
// Download Anexos do termo aditivo e contrato original
router.get('termo-aditivos/:termo_aditivo_id/anexos/zip', [
  TermoAditivoAnexosController,
  'downloadZip',
])

// Medição Anexos
router.post('/medicao/:lancamento_id/anexos', [MedicaoAnexosController, 'store'])
router.get('/medicao/:lancamento_id/anexos', [MedicaoAnexosController, 'index'])
router.get('/medicao/anexos/:id', [MedicaoAnexosController, 'show'])
router.put('/medicao/:lancamento_id/anexos/:id', [MedicaoAnexosController, 'update'])
router.delete('/medicao/anexos/:id', [MedicaoAnexosController, 'destroy'])
// Faturamento Anexos
router.post('/faturamento/:faturamento_id/anexos', [FaturamentoAnexosController, 'store'])
router.get('/faturamento/:faturamento_id/anexos', [FaturamentoAnexosController, 'index'])
router.get('/faturamento/anexos/:id', [FaturamentoAnexosController, 'show'])
router.put('/faturamento/:faturamento_id/anexos/:id', [FaturamentoAnexosController, 'update'])
router.delete('/faturamento/anexos/:id', [FaturamentoAnexosController, 'destroy'])
// Contrato PJ Anexos
router.post('/pj/:contrato_pj_id/anexos', [ContratoPjAnexosController, 'store'])
router.get('/pj/:contrato_pj_id/anexos', [ContratoPjAnexosController, 'index'])
router.get('/pj/anexos/:id', [ContratoPjAnexosController, 'show'])
router.put('/pj/:contrato_pj_id/anexos/:id', [ContratoPjAnexosController, 'update'])
router.delete('/pj/anexos/:id', [ContratoPjAnexosController, 'destroy'])
// Itens de contratos
router
  .group(() => {
    router.post('/contratos/:id/items', [ContratoItemController, 'createContractItem'])
    // router.get('/contratos/:id/items', [ContratoItemController, 'getContractItem'])
    router.get('/contratos/:id/items', [ContratoItemController, 'getContractItemByContract'])
    router.put('/contratos/items/:itemId', [ContratoItemController, 'updateContractItem'])
    router.delete('/contratos/items/:itemId', [ContratoItemController, 'deleteContractItem'])
  })
  .use(middleware.auth())
//Projetos
router
  .group(() => {
    router.post('/contratos/:contrato_id/projetos', [ProjetosController, 'store'])
    router.post('/contratos/:contrato_id/projetos/multiplos', [ProjetosController, 'storeMultiple'])
    router.get('/contratos/:contrato_id/projetos', [ProjetosController, 'index'])
    router.get('/projetos', [ProjetosController, 'getAllProjects'])
    router.get('/projetos/:id', [ProjetosController, 'show'])
    router.put('/projetos/:id', [ProjetosController, 'update'])
    router.delete('/projetos/:id', [ProjetosController, 'destroy'])
  })
  .use(middleware.auth())
//Lancamentos
router
  .group(() => {
    router.post('/contratos/:id/lancamentos', [LancamentosController, 'createLancamento'])
    router.get('/lancamentos', [LancamentosController, 'getLancamentos'])
    router.get('/lancamentos/:id', [LancamentosController, 'getLancamentoById'])
    router.get('/contratos/:id/lancamentos', [LancamentosController, 'getLancamentoByContract'])
    router.put('/lancamentos/:id', [LancamentosController, 'updateLancamento'])
    router.delete('/lancamentos/:id', [LancamentosController, 'deleteLancamento'])
    router.delete('/lancamentos/restore/:id', [LancamentosController, 'restoreLancamento'])
    router.delete('/lancamentos/:id/items/:itemId', [LancamentosController, 'deleteLancamentoItem'])
    router.post('/lancamentos/:id/items', [LancamentosController, 'addLancamentoItem'])
    router.patch('/lancamentos/:id/competencia', [LancamentosController, 'updateCompetencia'])
    router.patch('/lancamentos/:id/status', [LancamentosController, 'updateStatus'])
  })
  .use(middleware.auth())
//Faturamento
router
  .group(() => {
    router.post('/contratos/:id/faturamentos', [FaturamentosController, 'createFaturamentos'])
    router.put('/faturamentos/:id', [FaturamentosController, 'updateFaturamento'])
    router.get('/contratos/:id/faturamentos', [
      FaturamentosController,
      'getFaturamentosByContratoId',
    ])
    router.get('/contratos/:id/resumo', [FaturamentosController, 'getFinancialSummaryByContratoId'])
    router.delete('/faturamentos/:id', [FaturamentosController, 'deleteFaturamento'])
    router.put('/faturamentos/restore/:id', [FaturamentosController, 'restoreFaturamento'])
  })
  .use(middleware.auth())
//Unidade de medida
router
  .group(() => {
    router.post('/unidade_medida', [UnidadeMedidaController, 'store'])
    router.get('/unidade_medida', [UnidadeMedidaController, 'index'])
    router.get('/unidade_medida/:id', [UnidadeMedidaController, 'show'])
    router.put('/unidade_medida/:id', [UnidadeMedidaController, 'update'])
    router.delete('/unidade_medida/:id', [UnidadeMedidaController, 'destroy'])
  })
  .use(middleware.auth())
//Renovacoes
//Criar renovação
// router.post('/contratos/:id/renovar', [RenovacaoController, 'createRenovacao'])
// router.post('/renovacao/:renovacao_id/item', [RenovacaoController, 'createRenovacaoItens'])
// router.get('/contratos/:contrato_id/renovacoes', [RenovacaoController, 'getRenovacoesByContract'])
// router.get('/renovacoes/:renovacao_id', [RenovacaoController, 'getRenovacaoById'])
// router.delete('/renovacao/:renovacao_id', [RenovacaoController, 'deleteRenovacao'])
// router.delete('/renovacao/item/:item_id', [RenovacaoController, 'deleteRenovacaoItem'])
// router.delete('/renovacao/lancamento/item/:id_item', [RenovacaoController, 'deleteRenovacaoLancamentoItem'])
// router.post('/renovacoes/:renovacao_id/lancamentos', [RenovacaoController, 'createLancamentoRenovacao'])
// router.post('/renovacoes/lancamentos/:lancamento_id', [RenovacaoController, 'addItemToLancamento'])
// router.put('/renovacao/:renovacao_id', [RenovacaoController, 'updateRenovacao'])
// router.put('/renovacao/items/:id_item', [RenovacaoController, 'updateRenovacaoItem'])
router
  .group(() => {
    // Termo Aditivo
    router.get('/contratos/:contrato_id/termo-aditivo', [ContratosController, 'getTermosAditivos'])
    router.post('/termo-aditivo', [ContratosController, 'createTermoAditivo'])
  })
  .use(middleware.auth())
// router.get('/termo-aditivo/:id', [TermoAditivosController, 'show'])
// router.put('/termo-aditivo/:id', [TermoAditivosController, 'update'])
// router.delete('/termo-aditivo/:id', [TermoAditivosController, 'delete'])
// Item Termo Aditivo
// router.post('/termo-aditivo/itens', [TermoAditivoItemsController, 'store'])
// router.get('/termo-aditivo/:id/itens', [TermoAditivoItemsController, 'show'])
// router.put('/termo-aditivo/itens/:id', [TermoAditivoItemsController, 'update'])
// router.delete('/termo-aditivo/itens/:id', [TermoAditivoItemsController, 'delete'])
router
  .group(() => {
    router.get('/logs', [LogsController, 'index'])
  })
  .use(middleware.auth())
//Relatórios Mensais
router
  .group(() => {
    router.post('/relatorios-mensais', [RelatorioMensaisController, 'store'])
    router.get('/relatorios-mensais', [RelatorioMensaisController, 'index'])
    router.get('/relatorios-mensais/:id', [RelatorioMensaisController, 'show'])
    router.put('/relatorios-mensais/:id', [RelatorioMensaisController, 'update'])
    router.delete('/relatorios-mensais/:id', [RelatorioMensaisController, 'destroy'])
    router.get('/relatorios-mensais/:id/anexos', [RelatorioMensaisController, 'listarAnexos'])
    router.delete('/relatorios-mensais/anexos/:anexoId', [
      RelatorioMensaisController,
      'excluirAnexo',
    ])
    router.put('/relatorios-mensais/anexos/:anexoId', [RelatorioMensaisController, 'renomearAnexo'])
  })
  .use(middleware.auth())

// Contratos CLT
router.group(() => {
  router.post('/contrato-clt', [ContratoCltsController, 'store'])
  router.get('/contrato-clt', [ContratoCltsController, 'index'])
  router.get('/contrato-clt/:id', [ContratoCltsController, 'show'])
  router.put('/contrato-clt/:id', [ContratoCltsController, 'update'])
  router.delete('/contrato-clt/:id', [ContratoCltsController, 'destroy'])
  // Novas rotas para anexos do contrato CLT
  router.get('/contrato-clt/:id/documentos', [ContratoCltsController, 'getDocumentos'])
  router.delete('/contrato-clt/:id/documentos/:docPath', [ContratoCltsController, 'deleteDocument'])
  router.put('/contrato-clt/:id/documentos/:docPath', [
    ContratoCltsController,
    'updateDocumentName',
  ])
  // Adicionar esta nova rota para download
  router.get('/download/contrato-clt/:id/documento/:fileName', [
    ContratoCltsController,
    'downloadDocumento',
  ])
})

//Pagamentos
router
  .group(() => {
    router.post('/pagamentos', [PagamentosController, 'store'])
    router.get('/pagamentos', [PagamentosController, 'index'])
    router.get('/pagamentos/:id', [PagamentosController, 'show'])
    router.put('/pagamentos/:id', [PagamentosController, 'update'])
    router.delete('/pagamentos/:id', [PagamentosController, 'destroy'])
    router.get('/pagamentos/:id/anexos', [PagamentosController, 'listarAnexos'])
    router.delete('/pagamentos/anexos/:anexoId', [PagamentosController, 'excluirAnexo'])
    router.put('/pagamentos/anexos/:anexoId', [PagamentosController, 'renomearAnexo'])
  })
  .use(middleware.auth())

//Relatório de Férias
router.group(() => {
  router.get('/relatorio-ferias', [RelatorioFeriasController, 'index'])
  router.post('/relatorio-ferias', [RelatorioFeriasController, 'store'])
  router.get('/relatorio-ferias/:id', [RelatorioFeriasController, 'show'])
  router.put('/relatorio-ferias/:id', [RelatorioFeriasController, 'update'])
  router.delete('/relatorio-ferias/:id', [RelatorioFeriasController, 'destroy'])
  router.get('/relatorio-ferias/contrato/:contratoId', [
    RelatorioFeriasController,
    'historicoByContrato',
  ])
})
