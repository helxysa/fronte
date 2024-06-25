import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const UsersController = () => import('#controllers/users_controller')
const AuthController = () => import('#controllers/auth_controller')
const ContratosController = () => import('#controllers/contratos_controller')

router.post('/register', [AuthController, 'register']).as('auth.register')
router.post('/login', [AuthController, 'login']).as('auth.login')
router.delete('/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())
router.get('/me', [AuthController, 'me']).as('auth.me')

router.get('users', [UsersController, 'index'])
router.get('users/:id', [UsersController, 'show'])
router.post('users', [UsersController, 'store'])
router.put('users/:id', [UsersController, 'update'])
router.delete('users/:id', [UsersController, 'destroy'])

router.post('/contratos', [ContratosController, 'createContract'])
router.get('/contratos', [ContratosController, 'getContracts'])
router.get('/contratos/:id', [ContratosController, 'getContractById'])
router.put('/contratos/:id', [ContratosController, 'updateContract'])
router.delete('/contratos/:id', [ContratosController, 'deleteContract'])

// router.post('/contratos/:id/items', [ContratoItemController, 'createContractItem'])
// router.post('/contratos/:id/items', [ContratoItemController, 'getContractItem')
// router.put('/contratos/:contractId/items/:itemId', [ContratoItemController, 'updateContractItem'])
// router.delete('/contratos/:contractId/items/:itemId', [ContratoItemController, 'deleteContractItem'])
