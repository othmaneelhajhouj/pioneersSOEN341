const express = require('express');
const morgan = require('morgan');
const { PrismaClient, OrganizerStatus } = require("generated-prisma/client");
const crypto = require("crypto");
const QRCode = require('qrcode');

//ATTENTION: these requires will only work after you run "npm run build" once to create the /dist/ folder containing compiled JS files
const {adminOrganizers} = require("./dist/routes/adminOrganizers");
const {adminEvents} = require('./dist/routes/adminEvents');
const {adminAnalytics} = require('./dist/routes/adminAnalytics');
const { adminAnalyticsTrends } = require('./dist/routes/adminAnalyticsTrends');
const { adminRoleManagement } = require('./dist/routes/adminRoleManagement');

const eventRoutes = require('./routes/events.public')

const app = express();
const prisma = new PrismaClient();


app.use(express.static('public'));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(morgan('dev'));
app.set('view engine', 'ejs');

//Temp auth to pass middleware (adminOnly for now), replace with real auth later
app.use((req, _res, next) => {
    req.user = {id: 'admin-1', role: 'admin', organizerStatus:'approved'};
    next();
});

app.listen(3000);

app.use("/events", require("./routes/events.public"));
app.use("/organizers", require("./routes/events.organizer"));


//mount compiled adminOrganizers router 
app.use('/admin', adminOrganizers);

//mount compiled adminEvents router
app.use('/admin', adminEvents);

//mount compiled adminAnalytics router
app.use('/admin', adminAnalytics);

//mount compiled adminAnalyticsTrends router
app.use('/admin', adminAnalyticsTrends);

//mount compiled adminRoleManagement router
app.use('/admin', adminRoleManagement);

//endpoint to check server health
app.get('/health', (_req, res) => res.json({ok: true}));

//404 error page
app.use((req, res) => {
    res.status(404).send();
});
