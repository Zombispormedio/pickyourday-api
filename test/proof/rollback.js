var C = require("../config/config.js");
var mongoose = require('mongoose');
var async = require("async");
require(C.config + "database.js")();

var customerModel = require(C.models + "customer.js");
var companyModel = require(C.models + "company.js");
var pickModel = require(C.models + "pick.js");
var service_nameModel = require(C.models + "service_name.js");
var categoryModel = require(C.models + "category.js");

var category = new categoryModel({
	name: 'Peluqueria'
});
var company = new companyModel({
	cif: '000', name: 'Pi'
});
var customer = new customerModel({
	name: 'Claudia', email: 'pepo@hotmail.com', surname: 'Pascual', birthDate: new Date()
});
customer.location = { country: 'España' };
var pick = new pickModel({
	company: { id_service: 1 },
	initDate: new Date()
});

async.waterfall([
	function CommitCategoryAndCustomer(next) {
		async.parallel({
			category: function (cb) {
				category.save(function (err, result) {
					cb(err, result);
				});
			},
			customer: function (cb) {
				customer.save(function (err, result) {
					cb(err, result);
				});
			}

		}, next);
	},

	function CommitCompany(data, next) {
		company.customers.push(data.customer._id);
		company.category = data.category._id;
		company.save(function (err, result) {
			data.company = result;
			next(err, data);
		})
	},
	function CommitPick(data, next) {
		pick.id_customer = data.customer._id;
		pick.company.id_company = data.company._id;
		pick.save(function (err, result) {
			data.pick = result;
			next(err, data);
		})
	}

], function Finish(err, result) {
	if (err) {
		console.error(err);
		rollback(result, closeConnection);
	} else {
		console.error(result);
		closeConnection()
	}


});


function closeConnection() {
	mongoose.connection.close();
}

function rollback(data, cb) {

	async.each(Object.keys(data), function rollback(key, next) {
		if (data[key]) {
			data[key].remove(function (err) {
				next();
			});
		} else {
			next();
		}

	}, function () {
		console.log('Rollback done.');
		cb();
	})

}

















