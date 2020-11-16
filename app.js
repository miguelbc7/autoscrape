const express = require('express');
const app = express();
const AuthController = require('./auth/AuthController');
const ScraperController = require('./scraper/ScraperController');

app.use(function(req, res, next){
    res.setTimeout(20000000, function(){
        console.log('Request has timed out.');
        res.sendStatus(408);
    });

    next();
});
app.use('/api/auth', AuthController);
app.use('/api/scraper', ScraperController);

module.exports = app;