"use strict";const express = require('express');
const router = express.Router();
const faturamentosController = require('../controllers/faturamentosController');

router.get('/', faturamentosController.getAllFaturamento);
router.get('/:faturamentoId', faturamentosController.getFaturamentoById);
router.post('/:contractId/items/:itemId/', faturamentosController.createFaturamento)
router.put('/:faturamentoId', faturamentosController.updateFaturamento);
router.delete('/:faturamentoId', faturamentosController.deleteFaturamento);


module.exports = router;
