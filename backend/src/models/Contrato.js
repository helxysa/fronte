const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Contrato extends Model { }

Contrato.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome_cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vigencia: {
        type: DataTypes.DATE,
        allowNull: false
    },
    saldo_contrato: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fiscal: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ponto_focal: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cidade: {
        type: DataTypes.STRING,
        allowNull: false
    },
    objeto_contrato: {
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
    modelName: 'Contrato',
    tableName: 'contratos',
    timestamps: true,
});

module.exports = Contrato;
