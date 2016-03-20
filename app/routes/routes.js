var express=require("express");

module.exports = function (app) {

	app.get('/', function (req, res) {
		res.jsonp({ message: "Welcome to PickYourDay!!" });
	});
	

	var router = express.Router();

	router.route("")
		.get(function (req, res) {
			res.jsonp({ message: "Welcome to PickYourDay API!!!" });
		});

	

	router.use("/oauth", require("./auth.routes.js"));
	router.use("/customer", require("./customer.routes.js"));
	router.use("/system", require("./system.routes.js"));
	router.use("/company", require("./company.routes.js"));
    router.use("/developer", require("./developer.routes.js"));
    
	
	app.use("/api", router);
};