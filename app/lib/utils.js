var Utils = {};
var jwt = require('jsonwebtoken');
var fs = require("fs");
var request = require("request");
var C = require("../../config/config");
Utils.validatePresenceOf = function (value) {
    return value && value.length;
};

Utils.like = function (value) {
   return new RegExp('(\\b)(.*' + value + '.*)(\\b)', "ig")
}

Utils.likeLowerCase = function (value) {
    return new RegExp('^' + value + '$', "i")
}

Utils.sign = function (data) {
    data.created = new Date().getTime();
    return jwt.sign(data, C.secret);
}

Utils.verify = function (data) {
    return jwt.verify(data, C.secret);
}

Utils.generateID = function () {
    return Math.random().toString(36).substring(10);
}

Utils.download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        
        request(uri).pipe(fs.createWriteStream(filename)).on('close', function(){
            callback(res.headers["content-type"]);
        });
    });
}


Utils.removeAccents = function (text)
{
    var __r = 
    {
        'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'E',
        'È':'E','É':'E','Ê':'E','Ë':'E',
        'Ì':'I','Í':'I','Î':'I',
        'Ò':'O','Ó':'O','Ô':'O','Ö':'O',
        'Ù':'U','Ú':'U','Û':'U','Ü':'U',
    };
    
    return text.replace(/[ÀÁÂÃÄÅÆÈÉÊËÌÍÎÒÓÔÖÙÚÛÜ]/gi, function(m)
    {
        var ret = __r[m.toUpperCase()];

        if (m === m.toLowerCase())
            ret = ret.toLowerCase();

        return ret;
    });
};


module.exports = Utils;