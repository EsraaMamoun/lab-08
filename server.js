'use strict';
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const PORT = process.env.PORT || 4000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (err) => {
    throw new Error(err);
});
client.connect().then(() => {
    app.listen(PORT, () =>
        console.log(`my server is running on port ${PORT}`));
}).catch((err) => {
    throw new Error(`startup error ${err}`);
});