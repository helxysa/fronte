const ContratoItem = require("../models/ContratoItem");
const Faturamento = require("../models/Faturamento");
const Contrato = require("../models/Contrato");

exports.createFaturamento = async (req, res) => {
  const { contractId, itemId } = req.params;
  const { status, quantidade_itens } = req.body;

  try {
    const contratoItem = await ContratoItem.findOne({
      where: {
        contrato_id: contractId,
        id: itemId,
      },
    });

    if (!contratoItem) {
      return res
        .status(404)
        .send("Item de contrato não encontrado no contrato especificado");
    }

    const novoFaturamento = await Faturamento.create({
      contrato_item_id: itemId,
      titulo_item: contratoItem.titulo,
      status,
      quantidade_itens,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json(novoFaturamento);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao criar faturamento");
  }
};

exports.getFaturamentoById = async (req, res) => {
  const { faturamentoId } = req.params;

  try {
    const faturamento = await Faturamento.findByPk(faturamentoId);

    if (!faturamento) {
      return res.status(404).json({ message: "Faturamento não encontrado" });
    }

    res.json(faturamento);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

exports.getAllFaturamento = async (req, res) => {
  try {
    const faturamentos = await Faturamento.findAll({
      include: [
        {
          model: ContratoItem,
          as: "contrato_item",
          include: {
            model: Contrato,
            as: "contrato",
            attributes: ["saldo_contrato"],
          },
        },
      ],
    });

    res.json(faturamentos);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao buscar faturamentos");
  }
};

exports.updateFaturamento = async (req, res) => {
  const { faturamentoId } = req.params;
  const { status, quantidade_itens } = req.body;

  try {
    const faturamento = await Faturamento.findByPk(faturamentoId);

    if (!faturamento) {
      return res.status(404).json({ message: "Faturamento não encontrado" });
    }

    faturamento.status = status;
    faturamento.quantidade_itens = quantidade_itens;

    await faturamento.save();

    res.json(faturamento);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

exports.deleteFaturamento = async (req, res) => {
  const { faturamentoId } = req.params;

  try {
    const faturamento = await Faturamento.findByPk(faturamentoId);

    if (!faturamento) {
      return res.status(404).json({ message: "Faturamento não encontrado" });
    }

    await faturamento.destroy();

    res.json({ message: "Faturamento deletado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};
