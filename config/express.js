var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var cors=require("cors");

module.exports = function (app) {


    //Configuracion
    //Localizar ficheros estaticos

    // muestra todos las peticiones por consola
    app.use(morgan('dev'));

    //Permite cambiar el html con el método POST
    app.use(bodyParser.urlencoded({ extended: false, limit:"5mb" })); //parse x-www-form-urlencoded

    app.use(bodyParser.json({limit:"5mb"})); //parsea json;

    app.use(function(req, res, next){
        req.query = decodeURI(req.query);
        next();
    });

    //Simula delete y put
    app.use(methodOverride());
    app.use(cors());




};
