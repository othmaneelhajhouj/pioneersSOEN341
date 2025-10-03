const express = require('express');
const morgan = require('morgan');
const { PrismaClient } = require("generated-prisma/client");
const crypto = require("crypto");
const QRCode = require('qrcode');

const eventRoutes = require('./routes/events.public')

const app = express();
const prisma = new PrismaClient();


app.use(express.static('public'));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(morgan('dev'));
app.set('view engine', 'ejs');

app.listen(3000);

app.use("/events", require("./routes/events.public"));
app.use("/organizers", require("./routes/events.organizer"));

//404 error page
app.use((req, res) => {
    res.status(404).send();
});