var C = require("../../config/config");
var Response = require(C.lib + "response");
var AuthModel = require(C.models + "auth").Auth;
var CustomerModel = require(C.models + "customer");
var CompanyModel = require(C.models + "company");
var SystemCtrl = require(C.ctrl + "system.ctrl");
var Utils = require(C.lib + "utils");
var Mail = require(C.lib + "mail");
var Error = require(C.lib + "error")();
var async = require("async");
var Handlebars = require('handlebars');
var AuthController = {};


AuthController.register = function (role, user, id, cb) {
    var local = "RegisterAuthController";

    if (!user || !user.email || !user.password) return cb(Error.not_fields(local));

    var auth = new AuthModel({
        email: user.email,
        password: user.password,
        role: role,
        user: id
    });

    if (user.social) {
        auth.social = user.social;
    }

    auth.save(function (err) {
        if (err) return cb(Error.mongo_save(local, err));
        cb();
    });
};





AuthController.login = function (u, cb) {
    var local = "LoginAuthController";
    var self = this;
    async.waterfall([
        function (next) {
            AuthModel.findOne({ email: u.email }, function (err, user) {
                if (err) { return next(Error.mongo_find(local, err)); }

                if (!user) { return next(Error.no_users(local), false); }

                u.role = user.role;

                next(null, user);
            });
        },
        function (user, next) {
            user.authenticate(u, function (err, token) {
                if (err) return next(err);
                user.token.push(token);
                next(err, user, token);
            });
        },

        function lastAccess(auth, token, next) {

            if (self.Roles.Company(auth.role)) {

                CompanyModel.findOne({ "_id": auth.user }, function (err, c) {
                    if (err) return next(Error.mongo_find(null, err));
                    
                    c.lastAccess=new Date();   
                    c.save(function (err) {
                        if (err) return next(Error.mongo_save(null, err));

                        next(null, auth, token);
                    });


                });

            } else {
                if (self.Roles.Customer(auth.role)) {
                    CustomerModel.findOne({ "_id": auth.user }, function (err, c) {
                        if (err) return next(Error.mongo_find(null, err));
                        
                        c.lastAccess=new Date();  
                        c.save(function (err) {
                            if (err) return next(Error.mongo_save(null, err));

                            next(null, auth, token);
                        });
                    });
                }
            }


        },
        function (user, token, next) {
            user.save(function (err) {
                if (err) return next(Error.mongo_save(local, err))
                next(null, token, user.role);
            });
        },


        function getRoleCode(token, role, next) {
            SystemCtrl.generateRoleCode(role, function (err, code) {
                if (err) return next(err);
                next(null, token, code);
            });
        }
    ], function (err, token, role) {
        if (err) {
            err.place.push(local);
            return cb(err);
        }
        cb(false, { token: token, role: role });
    });

};

AuthController.checkAccess = function (fn) {
    var local = "CheckAccessAuthCtrl";

    return function (req, res, next) {
        var token = req.headers.authorization;

        if (!token) return Response.printError(res, Error.no_authorization(local));
        AuthModel.findByToken(token, function (err, auth) {
            if (err) return Response.printError(res, Error.mongo_find(local, err));
            if (!auth) return Response.printError(res, Error.no_authorization(local));

            if (!fn(auth.role)) return Response.printError(res, Error.no_authorization(local));

            req.user = auth.user;
            req.oauth = auth._id;
            next();
        });
    };
};

AuthController.checkAdmin = function () {
    var self = this;

    return self.checkAccess(function (role) {
        return role === 0;
    });

};

AuthController.Roles = {
    Customer: function (role) {
        return role === 1 || role === 0;
    },
    Company: function (role) {
        return role === 2 || role === 3;
    },

    CompanyBoss: function (role) {
        return role === 2;
    },
    CompanyWorker: function (role) {
        return role === 3;
    },

    Registered: function (role) {
        return role < 4;
    }
};

AuthController.checkCustomer = function () {
    var self = this;

    return self.checkAccess(AuthController.Roles.Customer);
};

AuthController.checkCompany = function () {
    var self = this;

    return self.checkAccess(AuthController.Roles.Company);

};

AuthController.checkCompanyBoss = function () {
    var self = this;

    return self.checkAccess(AuthController.Roles.CompanyBoss);

};

AuthController.checkCompanyWorker = function () {
    var self = this;

    return self.checkAccess(AuthController.Roles.CompanyWorker);

};
AuthController.checkRegistered = function () {
    var self = this;

    return self.checkAccess(AuthController.Roles.Registered);

};

AuthController.logout = function (token, cb) {
    var local = "LogoutAuthCtrl";

    if (!token) return cb(Error.no_data(local));
    AuthModel.removeToken(token, function (err) {
        if (err) {
            err.place.push(local);
            return cb(err);
        }
        cb();
    });
};

AuthController.check = function (query, cb) {
    var local = "CheckAuthCtrl";

    if (!query || !query.email) return cb(Error.not_fields(local));
    AuthModel.findOne({ email: query.email }, function (err, user) {
        if (err) return cb(Error.mongo_find(local, err));

        if (!user)
            return cb(null, false);

        cb(null, true);
    });
};

AuthController.UnableAccess = function (email, cb) {
    var local = "UnableAccessAuthCtrl";

    AuthModel.findOne({ email: email }, function (err, auth) {
        if (err) return cb(Error.mongo_find(local, err));
        auth.remove(function (err) {
            if (err) return cb(Error.mongo_remove(local, err));
            cb();
        });

    });

};

AuthController.getRole = function (code, cb) {
    var local = "getRoleAuthCtrl";

    SystemCtrl.verifyRoleCode(code, function (err, result) {
        if (err) {
            err.place.push(local);

            return cb(err);
        }

        cb(null, result);
    });
};


AuthController.forgotPassword = function (body, cb) {
    var local = "forgotPasswordAuthCtrl";

    if (!body || !body.email) return cb(Error.not_fields(local, "Por favor, rellena en Olvidar Contraseña"));

    var email = body.email;
    async.waterfall([
        function checkUser(next) {
            AuthModel.findOne({ email: email, }, function (err, user) {
                if (err) return next(Error.mongo_find(null, err));
                if (!user) return next(Error.no_users(null, "Email incorrecto"))
                if (user.social) return next(Error.forgot_social(null, "Lo siento, te has registrado con " + user.social + ". No podemos cambiarte la contraseña."));

                next(null, user);
            });
        },
        function getCode(user, next) {
            AuthController.UniqueResetCode(function (err, code) {
                if (err) return next(err);
                user.reset_code = code;
                next(null, user);
            });
        },
        function save(user, next) {
            user.save(function (err, result) {
                if (err) return next(Error.mongo_save(null, err));
                next(null, result)
            });
        },
        function getUser(item, next) {
            if (item.role == 2) {

                CompanyModel.findOne({ "_id": item.user }, function (err, c) {
                    if (err) return next(Error.mongo_find(null, err));
                    next(null, {
                        name: c.name, code: item.reset_code, email: c.email
                    })
                });

            } else {
                if (item.role == 0 || item.role == 1) {
                    CustomerModel.findOne({ "_id": item.user }, function (err, c) {
                        if (err) return next(Error.mongo_find(null, err));
                        next(null, {
                            name: c.name + " " + (c.surname ? c.surname : ""), code: item.reset_code, email: c.email
                        })
                    });
                }
            }
        },

        function sendMail(user, next) {

            var options = {};
            options.email = user.email;
            options.toname = user.name;
            options.subject = "Restablece tu contraseña de Pick Your Day";
            options.fromname = "Pick Your Day Support Team";

            var source = `<html>
            <body>
            <h3>Hola, {{name}} 😧</h3>
           <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. 😉</p>
           <p>Si solicitaste restablecer tu contraseña para {{email}}, copía el siguiente código y pégalo en el formulario.</p>
           <p>Tu código: {{code}}</p>
            <p>Si no hiciste esta solicitud, por favor, ignora este correo electrónico. </p>
            <h4> Consigue todos tus própositos y no pierdas el tiempo, <a href="http://www.pickyourday.tk/">Pick Your Day</a> ☺</h4>
            </body>
            </html>`;
            var template = Handlebars.compile(source);

            var result = template(user);

            options.text = result;

            Mail.send(options, next);
        }

    ], function (err) {
        if (err) {
            err.place.push(local);
            return cb(err);
        }
        cb();
    });




}

AuthController.UniqueResetCode = function (cb) {
    var local = "UniqueResetCodeAuthCtrl";

    function getCode() {
        return Utils.generateResetCode(5);
    }

    function checkCode(code) {
        AuthModel.findOne({ reset_code: code }, function (err, result) {
            if (err) return cb(Error.mongo_find(local, err));
            user = result;
            if (user) {
                checkCode(getCode());
            } else {
                cb(null, code);
            }


        })
    }

    checkCode(getCode())


}

AuthController.resetPassword = function (body, cb) {
    var local = "ResetPasswordAuthCtrl";

    if (!body || !body.password || !body.code) return cb(Error.not_fields(local));

    var password = body.password;
    var code = body.code;

    async.waterfall([
        function (next) {
            AuthModel.findOne({ reset_code: code, }, function (err, user) {
                if (err) return next(Error.mongo_find(null, err));
                if (!user) return next(Error.no_data(null, "Wrong Code in Reset Password"))

                next(null, user);
            });
        },
        function save(user, next) {
            user.reset_code = null;
            user.password = password;

            user.save(function (err, result) {
                if (err) return next(Error.mongo_save(null, err));

                next(null, result);
            });
        },
        function (item, next) {
            if (item.role == 2) {

                CompanyModel.findOne({ "_id": item.user }, function (err, c) {
                    if (err) return next(Error.mongo_find(null, err));
                    next(null, {
                        name: c.name, email: c.email
                    })
                });

            } else {
                if (item.role == 0 || item.role == 1) {
                    CustomerModel.findOne({ "_id": item.user }, function (err, c) {
                        if (err) return next(Error.mongo_find(null, err));
                        next(null, {
                            name: c.name + " " + c.surname, email: c.email
                        })
                    });
                }
            }
        }, function sendMail(user, next) {

            var options = {};
            options.email = user.email;
            options.toname = user.name;
            options.subject = "¡Enhorabuena! Has restablecido tu contraseña de Pick Your Day";
            options.fromname = "Pick Your Day Support Team";

            var source = `<html>
            <body>
            <h3>Hola, {{name}} 😬</h3>
           <p>La contraseña de tu cuenta {{email}} se ha restablecido satisfactoria😋</p>
            <h3> Consigue todos tus própositos y no pierdas el tiempo, <a href="http://www.pickyourday.tk/">Pick Your Day</a> 😗</h3>
            </body>
            </html>`;
            var template = Handlebars.compile(source);

            var result = template(user);

            options.text = result;

            Mail.send(options, next);
        }

    ], function (err) {
        if (err) {
            err.place.push(local);

            return cb(err);
        }

        cb();
    });

}



module.exports = AuthController;
