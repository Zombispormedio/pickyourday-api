var Utils = {};
var jwt = require('jsonwebtoken');
var fs = require("fs");
var request = require("request");
var crypto=require("crypto");
var uuid= require("node-uuid");
var _=require("lodash");
var C = require("../../config/config");
Utils.validatePresenceOf = function (value) {
    return value && value.length;
};

Utils.like = function (value) {
   return new RegExp('(\\b)(.*' + value + '.*)(\\b)', "ig")
};

Utils.likeLowerCase = function (value) {
    return new RegExp('^' + value + '$', "i")
};

Utils.sign = function (data) {
    data.created = new Date().getTime();
    return jwt.sign(data, C.secret);
};

Utils.verify = function (data) {
    return jwt.verify(data, C.secret);
};

Utils.generateID = function () {
    return Math.random().toString(36).substring(10);
};

Utils.download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        
        request(uri).pipe(fs.createWriteStream(filename)).on('close', function(){
            callback(res.headers["content-type"]);
        });
    });
};


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
    if(text == null)
        return text;
    
    return text.replace(/[ÀÁÂÃÄÅÆÈÉÊËÌÍÎÒÓÔÖÙÚÛÜ]/gi, function(m)
    {
        var ret = __r[m.toUpperCase()];

        if (m === m.toLowerCase())
            ret = ret.toLowerCase();

        return ret;
    });
};



Utils.mergeMongoObjects=function(dst, src){
	var keysDST=Object.keys(dst.toObject());
	var keysSRC=Object.keys(src);
	var merge_keys=_.union(keysDST, keysSRC)
				.filter(function(a){
					return a!=="__v"&&a!=="_id";
				});
	for(var i=0;i<merge_keys.length;i++){
		var key=merge_keys[i];
		dst[key]=null;
		dst[key]=src[key];
		
	}
	
	return dst;
};

Utils.round = function(value, step) {
    step || (step = 1.0);
    var inv = 1.0 / step;
    return Math.round(value * inv) / inv;
};

Utils.filterParams= function(params){
    var newParams = {};
    for(var key in params){
        if(params[key] !== void 0)
            newParams[key] = params[key];
    }
      

    return newParams;
};

Utils.parseDate = function(date){
   var yyyy = date.getFullYear().toString();
   var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = date.getDate().toString();

   var h = date.getHours().toString();
   var m = date.getMinutes().toString();
   return yyyy +"-"+ (mm[1]?mm:"0"+mm[0]) +"-"+ (dd[1]?dd:"0"+dd[0]); 

};


Utils.countDays = function(initDate, endDate){
    var _MS_PER_DAY = 1000 * 60 * 60 * 24;
    if(initDate != null && endDate != null){
      var utc1 = Date.UTC(initDate.getFullYear(), initDate.getMonth(), initDate.getDate());
      var utc2 = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }
    return 0;
};

Utils.countMinutes = function(initDate, endDate){
    var dif = initDate.getTime() - endDate.getTime()
    var seconds = dif / 1000/ 60;
    seconds = Math.abs(seconds);

    return Math.floor(seconds);
};

Utils.newUTC = function(date){
    return  new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                                
};

Utils.randomString=function (length, chars) {
  if(!chars) {
    throw new Error('Argument \'chars\' is undefined');
  }

  var charsLength = chars.length;
  if (charsLength > 256) {
    throw new Error('Argument \'chars\' should not have more than 256 characters'+ ', otherwise unpredictability will be broken');
  }

  var randomBytes = crypto.randomBytes(length);
  var result = new Array(length);

  var cursor = 0;
  for (var i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % charsLength];
  }

  return result.join('');
};

Utils.generateDeveloperToken=function(size){
  return Utils.randomString(size, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

};

Utils.generateDeveloperID=function(){
    return uuid.v4();
};

module.exports = Utils;