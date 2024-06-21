const Contrato = require("../models/Contrato");
const ContratoItem = require("../models/ContratoItem");
const Faturamento = require("../models/Faturamento");
const sequelize = require("../config/db");

exports.createContract = async (req, res) => {
  const {
    nome_cliente,
    vigencia,
    saldo_contrato,
    fiscal,
    ponto_focal,
    cidade,
    objeto_contrato,
    items,
  } = req.body;

  try {
    const novoContrato = await Contrato.create({
      nome_cliente,
      vigencia,
      saldo_contrato,
      fiscal,
      ponto_focal,
      cidade,
      objeto_contrato,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const contratoComItens = await Promise.all(
      items.map(async (item) => {
        const novoItem = await ContratoItem.create({
          contrato_id: novoContrato.id,
          titulo: item.titulo,
          unidade_medida: item.unidade_medida,
          valor_unitario: item.valor_unitario,
          saldo_quantidade_contratada: item.saldo_quantidade_contratada,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (item.faturamentos && item.faturamentos.length > 0) {
          await Promise.all(
            item.faturamentos.map(async (faturamento) => {
              await Faturamento.create({
                contrato_item_id: novoItem.id,
                titulo_item: faturamento.titulo_item,
                status: faturamento.status,
                quantidade_itens: faturamento.quantidade_itens,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            })
          );
        }

        novoItem.dataValues.faturamentos = item.faturamentos || [];

        return novoItem;
      })
    );

    res.status(201).json({
      ...novoContrato.dataValues,
      items: contratoComItens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.getContracts = async (req, res) => {
  try {
    const contratos = await Contrato.findAll({
      include: [
        {
          model: ContratoItem,
          as: "items",
          include: {
            model: Faturamento,
            as: "faturamentos",
          },
        },
      ],
    });

    res.json(contratos);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.getContractById = async (req, res) => {
  const { id } = req.params;

  try {
    const contrato = await Contrato.findByPk(id, {
      include: [
        {
          model: ContratoItem,
          as: "items",
          include: {
            model: Faturamento,
            as: "faturamentos",
          },
        },
      ],
    });

    if (!contrato) {
      return res.status(404).send("Contrato não encontrado!");
    }

    res.json(contrato);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.updateContract = async (req, res) => {
  const { id } = req.params;
  const {
    nome_cliente,
    vigencia,
    saldo_contrato,
    fiscal,
    ponto_focal,
    cidade,
    objeto_contrato,
    items,
  } = req.body;

  try {
    await sequelize.transaction(async (t) => {
      await Contrato.update(
        {
          nome_cliente,
          vigencia,
          saldo_contrato,
          fiscal,
          ponto_focal,
          cidade,
          objeto_contrato,
          updatedAt: new Date(),
        },
        {
          where: { id },
          transaction: t,
        }
      );

      await ContratoItem.destroy({
        where: { contrato_id: id },
        transaction: t,
      });



      if (items && items.length > 0) {
        for (const item of items) {
          const novoItem = await ContratoItem.create(
            {
              contrato_id: id,
              titulo: item.titulo,
              unidade_medida: item.unidade_medida,
              valor_unitario: item.valor_unitario,
              saldo_quantidade_contratada: item.saldo_quantidade_contratada,
              updatedAt: new Date(),
            },
            { transaction: t }
          );

          if (item.faturamentos && item.faturamentos.length > 0) {
            for (const faturamento of item.faturamentos) {
              await Faturamento.create(
                {
                  contrato_item_id: novoItem.id,
                  titulo_item: faturamento.titulo_item,
                  status: faturamento.status,
                  quantidade_itens: faturamento.quantidade_itens,
                  updatedAt: new Date(),
                },
                { transaction: t }
              );
            }
          }
        }
      }
    });

    const contratoComItens = await Contrato.findByPk(id, {
      include: {
        model: ContratoItem,
        as: "items",
        include: {
          model: Faturamento,
          as: "faturamentos",
        },
      },
    });

    res.status(200).json(contratoComItens);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.deleteContract = async (req, res) => {
  const { id } = req.params;

  let transaction;

  try {
    transaction = await sequelize.transaction();

    await ContratoItem.destroy({ where: { contrato_id: id }, transaction });
    await Contrato.destroy({ where: { id }, transaction });

    await transaction.commit();

    res.status(200).send("Contrato deletado com sucesso!");
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.createContractItem = async (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    unidade_medida,
    valor_unitario,
    saldo_quantidade_contratada,
  } = req.body;

  try {
    const novoItem = await ContratoItem.create({
      contrato_id: id,
      titulo,
      unidade_medida,
      valor_unitario,
      saldo_quantidade_contratada,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ novoItem });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.updateContractItem = async (req, res) => {
  const { contractId, itemId } = req.params;
  const {
    titulo,
    unidade_medida,
    valor_unitario,
    saldo_quantidade_contratada,
  } = req.body;

  try {
    const [rowsUpdated, updatedItem] = await ContratoItem.update(
      {
        titulo,
        unidade_medida,
        valor_unitario,
        saldo_quantidade_contratada,
        updatedAt: new Date(),
      },
      {
        where: {
          id: itemId,
          contrato_id: contractId,
        },
        returning: true,
      }
    );

    if (rowsUpdated === 0) {
      return res
        .status(404)
        .send("Item não encontrado ou não pertence a este contrato!");
    }

    res.status(200).json(updatedItem[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.deleteContractItem = async (req, res) => {
  const { contractId, itemId } = req.params;

  try {
    const item = await ContratoItem.findOne({
      where: {
        contrato_id: contractId,
        id: itemId,
      },
    });

    if (!item) {
      return res
        .status(404)
        .json({ message: "Item não encontrado no contrato" });
    }

    await item.destroy();

    const contract = await Contrato.findByPk(contractId, {
      include: [
        {
          model: ContratoItem,
          as: "items",
          include: {
            model: Faturamento,
            as: "faturamentos",
          },
        },
      ],
    });

    res.json(contract);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
