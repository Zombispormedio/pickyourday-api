var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var cors = require("cors");
var compression = require('compression');
var health = require('express-ping');
var toobusy = require('toobusy-js');
module.exports = function (app) {


    //Configuracion
    //Localizar ficheros estaticos

    // muestra todos las peticiones por consola
    app.use(morgan('dev'));

    //Permite cambiar el html con el método POST
    app.use(bodyParser.urlencoded({ extended: false, limit: "5mb" })); //parse x-www-form-urlencoded

    app.use(bodyParser.json({ limit: "5mb" })); //parsea json;

    app.use(function (req, res, next) {
        for (var query in req.query) {
            req.query[query] = decodeURI(req.query[query]);
        }
        next();
    });

    app.use(function (req, res, next) {
        if (toobusy()) {
            res.send(503, "I'm busy right now, sorry.");
        } else {
            next();
        }
    });

    //Simula delete y put
    app.use(methodOverride());
    app.use(cors());
    app.use(compression());
    app.use(health.ping());

};
