/* eslint-disable prettier/prettier */
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import Application from '@adonisjs/core/services/app'

const UsersController = () => import('#controllers/users_controller')
const AuthController = () => import('#controllers/auth_controller')
const ContratosController = () => import('#controllers/contratos_controller')
const RenovacaoController = () => import('#controllers/renovacao_controller')
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
//deletar faturamento da renovação
router.delete('/renovacao/faturamento/item/:id_item', [RenovacaoController, 'deleteRenovacaoFaturamentoItem'])
//Criar faturamento da renovação
router.post('/renovacoes/:renovacao_id/faturamentos', [RenovacaoController, 'createFaturamentoRenovacao'])
//adicionar item no faturamento da renovação
router.post('/renovacoes/faturamentos/:faturamento_id', [RenovacaoController, 'addItemToFaturamento'])
//atualizar renovação
router.put('/renovacao/:renovacao_id', [RenovacaoController, 'updateRenovacao'])
//atualizar item da renovação
router.put('/renovacao/items/:id_item', [RenovacaoController, 'updateRenovacaoItem'])
