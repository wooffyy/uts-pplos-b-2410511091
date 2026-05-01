require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT;
const router = require('./routes/orderRoutes');

app.use(require('helmet')())
app.use(express.json());
app.use('/', router);

app.listen(port, () => {
    console.log(`Service berjalan di port ${port}`);
});