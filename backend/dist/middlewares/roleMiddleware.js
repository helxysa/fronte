"use strict";const jwt = require("jsonwebtoken");
const pool = require('../config/db');

const checkRole = (roles) => {
    return (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) return res.sendStatus(401).send("Token não fornecido.");

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403).send("falha na autenticação.");
            req.user = user;

            pool.query('SELECT role FROM users WHERE username = $1', [user.username], (error, results) => {
                if (error) return res.sendStatus(500).send("Erro interno do servidor");
                if (results.rows.length === 0) return res.sendStatus(403).send("Usuário não encontrado");

                const userRole = results.rows[0].role;
                if (!roles.includes(userRole)) {
                    return res.sendStatus(403).send("Permissão negada");
                }

                next();
            });
        });
    };
};

module.exports = checkRole;
