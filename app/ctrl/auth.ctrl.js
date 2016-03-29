var C = require("../../config/config");
var Response = require(C.lib + "response");
var AuthModel = require(C.models + "auth").Auth;
var SystemCtrl = require(C.ctrl + "system.ctrl");
var Utils = require(C.lib + "utils");
var async = require("async");
var AuthController = {};


AuthController.register = function(role, user, id, cb) {

    if (!user || !user.email || !user.password) return cb("Fields not Filled");

    var auth = new AuthModel({
        email: user.email,
        password: user.password,
        role: role,
        user: id
    });

    auth.save(function(err) {
        if (err) return cb(err);
        cb();
    });
};





AuthController.login = function(u, cb) {

    async.waterfall([
        function(next) {
            AuthModel.findOne({ email: u.email }, function(err, user) {
                if (err) { return next(err); }

                if (!user) { return next("No users", false); }

                u.role = user.role;

                next(null, user);
            });
        },
        function(user, next) {
            user.authenticate(u, function(err, token) {
                user.token.push(token);
                next(err, user, token);
            });
        },
        function(user, token, next) {
            user.save(function(err) {
                next(err, token, user.role);
            });
        },


        function getRoleCode(token, role, next) {
            SystemCtrl.generateRoleCode(role, function(err, code) {
                if (err) return next(err);
                next(null, token, code);
            });
        }
    ], function(err, token, role) {
        if (err) return cb(err);
        cb(false, { token: token, role: role });
    });

};

AuthController.checkAccess = function(fn) {
    return function(req, res, next) {
        var token = req.headers.authorization;

        if (!token) return Response.printError(res, "No Authorization");
        AuthModel.findByToken(token, function(err, auth) {
            if (err) return Response.printError(res, err);
            if (!auth) return Response.printError(res, "No Authorization");

            if (!fn(auth.role)) return Response.printError(res, "No Authorization");

            req.user = auth.user;
            req.oauth = auth._id;
            next();
        });
    };
};

AuthController.checkAdmin = function() {
    var self = this;

    return self.checkAccess(function(role) {
        return role === 0;
    });

};

AuthController.Roles={
    Customer:function(role) {
        return role === 1 || role === 0;
    },
    Company:function(role) {
        return role === 2 || role === 3;
    },
    
    CompanyBoss:function(role) {
        return role === 2;
    },
    CompanyWorker:function(role) {
        return role === 3;
    },
    
    Registered:function(role) {
        return role < 4;
    }
};

AuthController.checkCustomer = function() {
    var self = this;

    return self.checkAccess(AuthController.Roles.Customer);
};

AuthController.checkCompany = function() {
    var self = this;

    return self.checkAccess(AuthController.Roles.Company);

};

AuthController.checkCompanyBoss = function() {
    var self = this;

    return self.checkAccess(AuthController.Roles.CompanyBoss);

};

AuthController.checkCompanyWorker = function() {
    var self = this;

    return self.checkAccess(AuthController.Roles.CompanyWorker);

};
AuthController.checkRegistered = function() {
    var self = this;

    return self.checkAccess(AuthController.Roles.Registered);

};

AuthController.logout = function(token, cb) {
    if (!token) return cb("No Token");
    AuthModel.removeToken(token, cb);
};

AuthController.check = function(query, cb) {
    if (!query || !query.email) return cb("Fields not filled");
    AuthModel.findOne({ email: query.email }, function(err, user) {
        if (err) return cb(err);

        if (!user)
            return cb(null, false);

        cb(null, true);
    });
};

AuthController.UnableAccess = function(email, cb) {
    AuthModel.findOne({ email: email }, function(err, auth) {
        if (err) return cb(err);
        auth.remove(function(err) {
            if (err) return cb(err);
            cb();
        });

    });

};

AuthController.getRole = function(code, cb) {
    SystemCtrl.verifyRoleCode(code, cb);
};






module.exports = AuthController;
