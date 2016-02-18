var express = require("express");
var C = require("./config/config.js");

var app = express();


//Configuracion
require(C.config + "express.js")(app);
var port = process.env.PORT || 5000;
app.set('port', port);
require(C.routes + "routes.js")(app);

var ConnectDB=require(C.config + "database.js");

var getPipeline=function(_p){
    return function(){
        _p.forEach(function(_elem){
            _elem();
        });
    };
};

var server= function (_run) {
    return function(){
        app.listen(port, function () {
            console.log("Conectado: " + app.get("port"));
            _run();
        });
    };

};

var runTest=require(C.test+"test.js");

var _pipeline=[runTest];

var runPipeline=getPipeline(_pipeline);

var runServer=server(runPipeline);

ConnectDB(runServer);










