var C=require("../../config/config");
var Response = require(C.lib + "response");
var AuthModel = require(C.models + "auth").Auth;
var async = require("async");
var AuthController = {};


AuthController.register = function (role, user, id, cb) {
	
		if (!user || !user.email || !user.password) return cb("Fields not Filled");

		var auth = new AuthModel({
			email: user.email,
			password: user.password,
			role: role,
			user:id
		});

		auth.save(function (err) {
			if (err) return cb(err);
			cb();
		});
}





AuthController.login = function (u, cb) {

	async.waterfall([
		function (next) {
			AuthModel.findOne({ email: u.email }, function (err, user) {
				if (err) { return next(err); }

				if (!user) { return next("No users", false); }

				u.role = user.role;

				next(null, user);
			});
		},
		function (user, next) {
			user.authenticate(u, function(err, token){
				user.token.push(token);
				next(err, user, token);
			});
		},
		function(user, token, next){
			user.save(function(err){
				next(err, token, user.role);
			});
		}
	], function(err, token, role) {
		if(err) return cb(err);
		cb(false, {token:token, role:role});
	});

};

AuthController.checkAccess=function(role){
	return function (req, res, next) {
		var token = req.headers.authorization;
		if(!token)return Response.printError(res,"No Authorization");
		AuthModel.findByToken(token, function(err,auth){
			if(err)return Response.printError(res, err);
            if(!auth)return Response.printError(res,"No Authorization");
            if(role<5){
                if((auth.role!==role && auth.role!==0)) return Response.printError(res,"No Authorization");    
            }
			
			req.user=auth.user;
			next();
		});
	}
}

AuthController.logout=function(token, cb){
	if(!token)return cb("No Token");
	AuthModel.removeToken(token, cb);
}

AuthController.check=function(query, cb){
	if(!query || !query.email) return cb("Fields not filled");
	AuthModel.findOne({email: query.email},function(err, user){
		if(err)return cb(err);

		if(!user)
			return cb(null, false);

		cb(null, true);
	});
}

AuthController.UnableAccess=function(email, cb){
	AuthModel.findOne({email:email}, function(err, auth){
		if(err)return cb(err);
		auth.remove(function(err){
			if(err)return cb(err);
			cb();
		});
		
	});
	
}

module.exports = AuthController;