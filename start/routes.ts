/* eslint-disable prettier/prettier */
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import Application from '@adonisjs/core/services/app'
// import RenovacaoController from '#controllers/renovacao_controller'

const UsersController = () => import('#controllers/users_controller')
const AuthController = () => import('#controllers/auth_controller')
const ContratosController = () => import('#controllers/contratos_controller')
const ContratoItemController = () => import('#controllers/contrato_item_controller')
const FaturamentosController = () => import('#controllers/faturamentos_controller')

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
// Contratos
router.post('/contratos', [ContratosController, 'createContract'])
router.get('/contratos', [ContratosController, 'getContracts'])
router.get('/contratos/:id', [ContratosController, 'getContractById'])
router.put('/contratos/:id', [ContratosController, 'updateContract'])
router.delete('/contratos/:id', [ContratosController, 'deleteContract'])
// Itens de contratos
router.post('/contratos/:id/items', [ContratoItemController, 'createContractItem'])
router.get('/contratos/:id/items', [ContratoItemController, 'getContractItem'])
router.put('/contratos/items/:itemId', [ContratoItemController, 'updateContractItem'])
router.delete('/contratos/items/:itemId', [ContratoItemController, 'deleteContractItem'])
//Faturamentos
router.post('/contratos/:id/faturamentos', [FaturamentosController, 'createFaturamento'])
router.get('/faturamentos', [FaturamentosController, 'getFaturamentos'])
router.get('/faturamentos/:id', [FaturamentosController, 'getFaturamentoById'])
router.put('/faturamentos/:id', [FaturamentosController, 'updateFaturamento'])
router.delete('/faturamentos/:id', [FaturamentosController, 'deleteFaturamento'])
router.delete('/faturamentos/:id/items/:itemId', [FaturamentosController, 'deleteFaturamentoItem'])
router.post('/faturamentos/:id/items', [FaturamentosController, 'addFaturamentoItem'])

//Renovacoes
router.post('/contratos/:id/renovar', [ContratosController, 'createRenovacao'])
router.post('/renovacao/:renovacao_id/item', [ContratosController, 'createRenovacaoItens'])
router.get('/contratos/:contrato_id/renovacoes', [ContratosController, 'getRenovacoesByContract'])
router.get('/renovacoes/:renovacao_id', [ContratosController, 'getRenovacaoById'])
router.delete('/renovacao/:renovacao_id', [ContratosController, 'deleteRenovacao'])
router.delete('/renovacao/item/:item_id', [ContratosController, 'deleteRenovacaoItem'])
router.post('/renovacoes/:renovacao_id/faturamentos', [ContratosController, 'createFaturamentoRenovacao'])
