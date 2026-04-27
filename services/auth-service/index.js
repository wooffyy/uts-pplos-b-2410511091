require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT;
const router = require('./routes/route');

app.use(cors());
app.use(express.json());
app.use('/auth', router);

app.listen(port, () => {
    console.log(`Service berjalan di port ${port}`);
});