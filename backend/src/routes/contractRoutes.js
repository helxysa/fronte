const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authenticateToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

//Rotas de contrato
router.post('/', contractController.createContract);
router.get('/', contractController.getContracts);
router.get('/:id', contractController.getContractById);
router.put('/:id', contractController.updateContract);
router.delete('/:id', contractController.deleteContract);

//Rotas dos itens de contrato
router.put('/:contractId/items/:itemId', contractController.updateContractItem);
router.delete('/:contractId/items/:itemId', contractController.deleteContractItem);
router.post('/:id/items/', contractController.createContractItem);


module.exports = router;
