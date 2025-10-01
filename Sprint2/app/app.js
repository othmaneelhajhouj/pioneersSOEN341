const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(express.static('public'));
app.use(morgan('dev'));
app.set('view engine', 'ejs');

app.listen(3000);

app.get('/', (req, res) => {
    res.send('index')
});

//404 error page
app.use((req, res) => {
    res.status(404).send();
});