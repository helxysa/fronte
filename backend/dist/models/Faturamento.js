"use strict";const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const ContratoItem = require('../models/ContratoItem');

class Faturamento extends Model {}
Faturamento.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    contrato_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ContratoItem,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    titulo_item: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantidade_itens: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'Faturamento',
    tableName: 'faturamentos'
});

ContratoItem.hasMany(Faturamento, {
    foreignKey: 'contrato_item_id',
    as: 'faturamentos'
  });

  Faturamento.belongsTo(ContratoItem, {
    foreignKey: 'contrato_item_id',
    as: 'contrato_item'
  });

module.exports = Faturamento;
