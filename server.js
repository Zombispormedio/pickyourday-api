var express = require("express");
var C = require("./config/config.js");

var app = express();

//Configuracion
require(C.config + "express.js")(app);
var port = process.env.PORT || 5000;
app.set('port', port);
require(C.routes + "routes.js")(app);

var ConnectDB = require(C.config + "database.js");

var Server = function () {
    app.listen(port, function () {
        console.log("Conectado: " + app.get("port"));
        console.log("Iniciado: " + new Date());

    });
}


ConnectDB(Server);










