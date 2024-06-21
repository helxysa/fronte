"use strict";const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(401).send("token não fornecido");

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403).send("Falha na autenticação");
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
