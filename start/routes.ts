/* eslint-disable prettier/prettier */
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import Application from '@adonisjs/core/services/app'

const UsersController = () => import('#controllers/users_controller')
const AuthController = () => import('#controllers/auth_controller')
const ContratosController = () => import('#controllers/contratos_controller')
const RenovacaoController = () => import('#controllers/renovacao_controller')
const ContratoItemController = () => import('#controllers/contrato_item_controller')
const LancamentosController = () => import('#controllers/lancamentos_controller')
const FaturamentosController = () => import('#controllers/faturamentos_controller')
const UnidadeMedidaController = () => import('#controllers/unidade_medida_controller')
const ProjetosController = () => import('#controllers/projetos_controller')
// Registro, Login e Autenticação
router.post('/register', [AuthController, 'register']).as('auth.register')
router.post('/login', [AuthController, 'login']).as('auth.login')
router.delete('/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
router.get('/me', [AuthController, 'me']).as('auth.me')
// Usuários
router.get('users', [UsersController, 'index'])
router.get('users/:id', [UsersController, 'show'])
router.post('users', [UsersController, 'store'])
router.put('users/:id', [UsersController, 'update'])
router.delete('users/:id', [UsersController, 'destroy'])
router.get('files/:filename', async ({ params, response }) => {
  return response.attachment(Application.tmpPath('uploads', params.filename), params.filename)
})
// Dashboard
router.get('/dashboard', [ContratosController, 'getDashboard'])
// Contratos
router.post('/contratos', [ContratosController, 'createContract'])
router.get('/contratos', [ContratosController, 'getContracts'])
router.get('/contratos/:id', [ContratosController, 'getContractById'])
router.put('/contratos/:id', [ContratosController, 'updateContract'])
router.put('/contratos/restore/:id', [ContratosController, 'restoreContract'])
router.delete('/contratos/:id', [ContratosController, 'deleteContract'])
// Itens de contratos
router.post('/contratos/:id/items', [ContratoItemController, 'createContractItem'])
// router.get('/contratos/:id/items', [ContratoItemController, 'getContractItem'])
router.get('/contratos/:id/items', [ContratoItemController, 'getContractItemByContract'])
router.put('/contratos/items/:itemId', [ContratoItemController, 'updateContractItem'])
router.delete('/contratos/items/:itemId', [ContratoItemController, 'deleteContractItem'])
//Projetos
router.post('/contratos/:contrato_id/projetos', [ProjetosController, 'store'])
router.post('/contratos/:contrato_id/projetos/multiplos', [ProjetosController, 'storeMultiple'])
router.get('/contratos/:contrato_id/projetos', [ProjetosController, 'index'])
router.get('/projetos/:id', [ProjetosController, 'show'])
router.put('/projetos/:id', [ProjetosController, 'update'])
router.delete('/projetos/:id', [ProjetosController, 'destroy'])
//Lancamentos
router.post('/contratos/:id/lancamentos', [LancamentosController, 'createLancamento'])
router.get('/lancamentos', [LancamentosController, 'getLancamentos'])
router.get('/lancamentos/:id', [LancamentosController, 'getLancamentoById'])
router.get('/contratos/:id/lancamentos', [LancamentosController, 'getLancamentoByContract'])
router.put('/lancamentos/:id', [LancamentosController, 'updateLancamento'])
router.delete('/lancamentos/:id', [LancamentosController, 'deleteLancamento'])
router.delete('/lancamentos/restore/:id', [LancamentosController, 'restoreLancamento'])
router.delete('/lancamentos/:id/items/:itemId', [LancamentosController, 'deleteLancamentoItem'])
router.post('/lancamentos/:id/items', [LancamentosController, 'addLancamentoItem'])
//Faturamento
router.post('/contratos/:id/faturamentos', [FaturamentosController, 'createFaturamentos'])
router.put('/faturamentos/:id', [FaturamentosController, 'updateFaturamento'])
router.get('/contratos/:id/faturamentos', [FaturamentosController, 'getFaturamentosByContratoId'])
router.delete('/faturamentos/:id', [FaturamentosController, 'deleteFaturamento'])
router.put('/faturamentos/restore/:id', [FaturamentosController, 'restoreFaturamento'])
//Unidade de medida
router.post('/unidade_medida', [UnidadeMedidaController, 'store'])
router.get('/unidade_medida', [UnidadeMedidaController, 'index'])
router.get('/unidade_medida/:id', [UnidadeMedidaController, 'show'])
router.put('/unidade_medida/:id', [UnidadeMedidaController, 'update'])
router.delete('/unidade_medida/:id', [UnidadeMedidaController, 'destroy'])
//Renovacoes
//Criar renovação
router.post('/contratos/:id/renovar', [RenovacaoController, 'createRenovacao'])
//Criar item da renovação
router.post('/renovacao/:renovacao_id/item', [RenovacaoController, 'createRenovacaoItens'])
//Listar renovação por contrato
router.get('/contratos/:contrato_id/renovacoes', [RenovacaoController, 'getRenovacoesByContract'])
//Listar renovação por id
router.get('/renovacoes/:renovacao_id', [RenovacaoController, 'getRenovacaoById'])
//deletar renovação
router.delete('/renovacao/:renovacao_id', [RenovacaoController, 'deleteRenovacao'])
//deletar item da renovação
router.delete('/renovacao/item/:item_id', [RenovacaoController, 'deleteRenovacaoItem'])
//deletar lancamento da renovação
router.delete('/renovacao/lancamento/item/:id_item', [RenovacaoController, 'deleteRenovacaoLancamentoItem'])
//Criar lancamento da renovação
router.post('/renovacoes/:renovacao_id/lancamentos', [RenovacaoController, 'createLancamentoRenovacao'])
//adicionar item no lancamento da renovação
router.post('/renovacoes/lancamentos/:lancamento_id', [RenovacaoController, 'addItemToLancamento'])
//atualizar renovação
router.put('/renovacao/:renovacao_id', [RenovacaoController, 'updateRenovacao'])
//atualizar item da renovação
router.put('/renovacao/items/:id_item', [RenovacaoController, 'updateRenovacaoItem'])
