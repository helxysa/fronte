"use strict";const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser.json());

const authRoutes = require('./routes/authRoutes');
const contractRoutes = require('./routes/contractRoutes');
const faturamentosRoutes = require('./routes/faturamentosRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/auth', authRoutes);
app.use('/contracts', contractRoutes);
app.use('/faturamentos', faturamentosRoutes);
app.use('/user', userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
});
