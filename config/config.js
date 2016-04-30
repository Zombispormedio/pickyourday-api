var path = require("path"),
    rootPath = path.normalize(__dirname + "/..");

var rootfunc = function (basename) {
    return path.normalize(rootPath+"/"+basename);
};

var rootSpecialfunc = function (basename) {
    return path.normalize("/"+basename);
};

var secure = function (value) {
    return { writable: false, configurable: true, value: value };
};

var secure_path=function(basename){
    return secure(rootfunc(basename));
};

var secure_special_path=function(basename){
    return secure(rootSpecialfunc(basename));
};

var Config = Object.create(null);
Config.prototype = {};
var config = Object.create(Config.prototype, {
    db: secure(process.env.db),
    db_secure: secure("mongodb://127.0.0.1:27017/pickyourday"),
    root: secure(rootPath),
    config: secure_path("config/"),
    routes: secure_path("app/routes/"),
    lib:secure_path("app/lib/"),
    models:secure_path("app/models/"),
    temp:secure_special_path("temp/"),
    test:secure_path("test/"),
    ctrl:secure_path("app/ctrl/"),
    secret:secure(process.env.secret),
    domain:secure("pickyourday.herokuapp.com"),
    company:secure("KenoviApps"),
    product:secure("PickYourDay"),
    lang:secure("ES"),
    pagination:secure(5)
});



module.exports = config;
