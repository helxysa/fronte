const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const Contrato = require('./Contrato');

class ContratoItem extends Model {}
ContratoItem.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    contrato_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Contrato,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    unidade_medida: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor_unitario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    saldo_quantidade_contratada: {
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
    modelName: 'ContratoItem',
    tableName: 'contrato_itens'
});

Contrato.hasMany(ContratoItem, {
    foreignKey: 'contrato_id',
    as: 'items'
});

ContratoItem.belongsTo(Contrato, {
    foreignKey: 'contrato_id',
    as: 'contrato'
  });

module.exports = ContratoItem;
