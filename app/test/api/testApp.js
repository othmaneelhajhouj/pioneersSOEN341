//express app only for tests
const express = require('express');
const bodyParser = require('body-parser');
const {tickets} = require('../../dist/routes/tickets');

function makeTestApp({user} = {}) 
{
  const app = express();
  app.use(bodyParser.json());
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.use(tickets);
  return app;
}
module.exports = {makeTestApp};