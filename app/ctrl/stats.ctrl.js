var C = require("../../config/config");

var CompanyModel = require(C.models + "company");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var PromotionCtrl = require(C.ctrl + "promotion.ctrl");
var ResourceCtrl = require(C.ctrl + "resource.ctrl");
var HistoryCtrl = require(C.ctrl + "history.ctrl");
var HPickModel = require(C.models + "history_pick");

var async = require("async");
var Utils = require(C.lib + "utils");
var _ = require("lodash");
var Controller = {};

function Stat(position, data, size, color) {
	this.position = position || [];
	this.size = size || [1, 1, 1];
	this.color = color || [1, 0, 0, 0.1];
	this.data = data || ["", 0, ""];
}

function Vertice(key, y) {
	this.key = key || 0;
	this.y = y || 0;
}

Controller.statsPicks = function (company, query, cb) {
	var timeArray = getDates(query);
	var servicesArray = [];
	var arrayData = [];

	var maxY = 0;
	var maxX = 2;
	var maxZ = 0;

	var states = ["cancelled", "finished"];

	var xValues = ["Cancelados", "Finalizados"];
	var zValues;
	var yValues;

	var self = this;
	async.waterfall([
		function getServices(next) {
			self.getServices(company, {}, function (err, services, values) {
				if (err) return cb(err);
				zValues = values;
				servicesArray = services;

				next();
			})
		}, function getPicks(next) {

			maxZ = servicesArray.length;
			var percent_total = timeArray.length * states.length;
			var percent = 0;

			var paramsTemp = {};
			paramsTemp["company.id_company"] = company;

			HistoryCtrl.getPicks(paramsTemp, function(err, picks){

				async.eachSeries(states, function (state, subNext) {
					var datesPick = [];
					async.eachSeries(timeArray, function (date, subSubNext) {
						var picksServices = [];

						async.eachSeries(servicesArray, function (service, subSubSubNext) {

							var paramsTemp = {};
							paramsTemp["company.id_service"] = service;
							paramsTemp["company.id_company"] = company;
							paramsTemp.state = state;
							paramsTemp.beforeInitDate = date.end;
							paramsTemp.afterInitDate = date.init;
							
							var picksFiltered = picks.filter(function(p){

								var valid=true;
								if(!p.company.id_service.equals(service)  && p.state == state && p.initDate < date.init && p.initDate > date.end)
									valid =false;

								return valid;
							})
							if(picksFiltered != null)
								picksServices.push(picksFiltered.length);
							else
								picksServices.push(0);

								subSubSubNext();
							


						}, function (err) {
							if (err) return subSubNext(err);
							datesPick.push(picksServices);

							subSubNext();
						});
						percent++;
						console.log("Loading StatsPicks: "+(((percent / percent_total) * 100).toFixed(2)) + "%");

					}, function (err) {
						if (err) return subNext(err);
						arrayData.push(datesPick);

						subNext();
					});
				}, function (err) {
					if (err) return next(err);
					next();
				});



			});


			
		}, function normalize(next) {
			var legend = { "x": "Picks cancelados/terminados", "y": "Cantidad", "z": "Servicios", "w": "Tiempo" }
			var data = self.normalize4(timeArray, arrayData, maxX, maxY, maxZ, xValues, zValues, 100);
			data.legend = legend;
			next(null, data);

		}

	], function (err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
};

Controller.originPicks = function (company, query, cb) {
	var timeArray = getDates(query);
	var servicesArray = [];
	var arrayData = [];

	var maxY = 0;
	var maxX = 4;
	var maxZ = 0;

	var origins = ['prepick', 'mobile', 'manual', 'promotion'];

	var xValues = ["Prepick", "Movil", "Compañia", "Promocion"];
	var zValues;
	var yValues;


	var self = this;
	async.waterfall([
		function getServices(next) {
			self.getServices(company, {}, function (err, services, values) {
				if (err) return cb(err);
				zValues = values;
				servicesArray = services;
				next();
			})
		}, function getPicks(next) {

			maxZ = servicesArray.length;
			async.eachSeries(origins, function (origin, subNext) {
				var datesPick = [];
				async.eachSeries(timeArray, function (date, subSubNext) {
					var picksServices = [];
					async.eachSeries(servicesArray, function (service, subSubSubNext) {

						var paramsTemp = {};
						paramsTemp["company.id_service"] = service;
						paramsTemp["company.id_company"] = company;
						paramsTemp.origin = [origin];
						paramsTemp.beforeInitDate = date.end;
						paramsTemp.afterInitDate = date.init;
						HistoryCtrl.getPicks(paramsTemp, function (err, picks) {
							var count = 0;
							if (picks)
								count = picks.length;

							if (maxY < count)
								maxY = count;

							picksServices.push(count);

							subSubSubNext();

						})
					}, function (err) {
						if (err) return cb(err);
						datesPick.push(picksServices);
						subSubNext();
					});

				}, function (err) {
					if (err) return cb(err);
					arrayData.push(datesPick);
					subNext();
				});
			}, function (err) {
				if (err) return cb(err);
				next();
			});
		}, function normalize(next) {
			var legend = { "x": "Origen pick Prepick/movil/manual", "y": "Cantidad", "z": "Servicios", "w": "Tiempo" }
			var data = self.normalize4(timeArray, arrayData, maxX, maxY, maxZ, xValues, zValues, 100);
			data.legend = legend;
			next(null, data);


		}

	], function (err, result) {
		if (err) return cb(err);
		cb(null, result);
	});

}

Controller.moneyResources =function(company, query,cb){
	var timeArray = getDates(query);
	var servicesArray = [];
	var resourcesArray = [];
	var arrayData = [];

	var maxY = 0;
	var maxX = 0;
	var maxZ = 0;


	var xValues;
	var zValues;
	var yValues;

	var self = this;

	async.waterfall([
		function getServices(next) {
			self.getServices(company, {}, function (err, services, values) {
				if (err) return cb(err);
				zValues = values;
				servicesArray = services;
				maxZ = servicesArray.length;
				next();
			})
		},
		function getResources(next) {
			self.getResources(company, {}, function (err, resources, values) {
				if (err) return cb(err);
				xValues = values;
				resourcesArray = resources;
				maxX = resourcesArray.length;
				next();
			})
		},
		function getPicks(next){
			var limitInit = new Date();
			limitInit.setMinutes(1);
			limitInit.setSeconds(0);
			limitInit.setHours(1);
			limitInit.setMilliseconds(0);
			var limitEnd = _.clone(limitInit);
			limitEnd.setMinutes(0);
			var size;
			if (query.month != undefined && query.month != "") {
				limitInit.setMonth(limitInit.getMonth() - parseInt(query.month));
				size = query.month;
			} else {
				limitInit.setDate(limitInit.getDate() - 30);
				size = 30;
			}

			var result = [];
			var paramsTemp = {};
			paramsTemp["company.id_company"] = company;
			paramsTemp.state = ["finished"];
			HistoryCtrl.getPicks(paramsTemp, function(err, picks){

				async.eachSeries(resourcesArray, function (res, subNext) {
					var datesPick = [];
					async.eachSeries(timeArray, function (date, subSubNext) {
						var picksServices = [];

						async.eachSeries(servicesArray, function (service, subSubSubNext) {
							
							var picksFiltered = picks.filter(function(p){
								var valid=true;
								if(p.resource == null || p.price == null)
									valid = false;
								else if(!p.company.id_service.equals(service)  &&  !p.resource.equals(res)  && p.initDate < date.init && p.initDate > date.end)
									valid =false;
								return valid;
							})

							

							if(picksFiltered != null){
								var total = picksFiltered.reduce(function (previous, key) {
									
								    return previous + key.price;
								}, 0);
								console.log(total);
								picksServices.push(total);
							}else
								picksServices.push(0);

								subSubSubNext();
							


						}, function (err) {
							if (err) return subSubNext(err);
							datesPick.push(picksServices);
							subSubNext();
						});
					}, function (err) {
						if (err) return subNext(err);
						arrayData.push(datesPick);
						subNext();
					});
				}, function (err) {
					if (err) return next(err);
					next();
				});

			});

		},
		function normalize(next) {
			var legend = { "x": "Empleados", "y": "Dinero", "z": "Servicios", "w": "Tiempo" }
			var data = self.normalize4(timeArray, arrayData, maxX, maxY, maxZ, xValues, zValues, 100);
			data.legend = legend;
			next(null, data);

		}

	], function (err, result) {
		if (err) return cb(err);
		cb(null, result);
	});

}

Controller.scoreServices = function (company, query, cb) {
	var timeArray = getDates(query);
	var servicesArray = [];
	var arrayData = [];

	var maxY = 0;
	var maxX = 4;
	var maxZ = 0;

	var scores = [1, 2, 3, 4, 5];

	var xValues = ["1", "2", "3", "4", "5"];
	var zValues;
	var yValues;


	var self = this;
	async.waterfall([
		function getServices(next) {
			ServiceCtrl.search(company, {}, function (err, services) {
				if (err) return cb(err);
				if (services && services.length > 0) {
					servicesArray = services;
					zValues = services.map(function (a) {
						if (a.name == undefined)
							return a.id_name.name;
						return a.name;
					});
					next();

				} else cb(-1);
			})
		}, function getScores(next) {
			maxZ = servicesArray.length;

			var limitInit = new Date();
			limitInit.setMinutes(1);
			limitInit.setSeconds(0);
			limitInit.setHours(1);
			limitInit.setMilliseconds(0);
			var limitEnd = _.clone(limitInit);
			limitEnd.setMinutes(0);
			var size;
			if (query.month != undefined && query.month != "") {
				limitInit.setMonth(limitInit.getMonth() - parseInt(query.month));
				size = query.month;
			} else {
				limitInit.setDate(limitInit.getDate() - 30);
				size = 30;
			}

			var result = [];

			async.eachSeries(servicesArray, function (service, subNext) {
				var reviews = service.rating;
				var scoreService = [];
				for (var i = 0; i < size; i++) {
					scoreService.push([]);
					for (var z in scores) {
						scoreService[i].push(0);
					}
				}
				for (var rev in reviews) {
					var rate = reviews[rev].rating;
					var date = reviews[rev].date;
					if (date >= limitInit && date <= limitEnd) {
						if (query.month == undefined || query.month == "") {
							var day = Utils.countDays(limitInit, date);
							if (day >= 0)
								scoreService[day][rate - 1]++;
						} else {
							var month = Utils.countDays(limitInit, date);
							if (month >= 0)
								scoreService[month][rate - 1]++;
						}
					}
				}



				arrayData.push(scoreService);
				subNext();

			}, function (err) {

				next();
			});
		}, function normalize(next) {
			var legend = { "x": "Valoraciones 1/2/3/4/5", "y": "Cantidad", "z": "Servicios", "w": "Tiempo" }
			var data = self.normalize4(timeArray, arrayData, maxX, maxY, maxZ, xValues, zValues, 100);
			data.legend = legend;
			next(null, data);


		}

	], function (err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
}

Controller.getServices = function (company, query, cb) {
	var servicesArray = [];
	var values = [];
	ServiceCtrl.search(company, {}, function (err, services) {
		if (err) return cb(err);

		if (services && services.length > 0) {
			servicesArray = services.map(function (a) {
				return a._id;
			});
			values = services.map(function (a) {
				if (a.name == undefined)
					return a.id_name.name;
				return a.name;
			});
			cb(null, servicesArray, values);

		} else cb([]);
	})

}

Controller.getResources = function (company, query, cb) {
	var resourcesArray = [];
	var values = [];
	ResourceCtrl.search(company, {}, function (err, resources) {
		if (err) return cb(err);

		if (resources && resources.length > 0) {
			resourcesArray = resources.map(function (a) {
				return a._id;
			});
			values = resources.map(function (a) {
				return a.name;
			});
			cb(null, resourcesArray, values);

		} else cb([]);
	})

}

Controller.normalize4 = function (arrayBase, arrayData, maxX, maxY, maxZ, xValues, zValues, grill) {
	var sizeValue = 10;
	var fit = false;
	var max = maxX;
	var result = [];
	var grillX = grill;
	var grillY = grill / 2;
	var grillZ = grill;
	if (maxY == null)
		maxY = 0;
	if (maxZ == null)
		maxZ = 0;
	while (!fit) {
		if (maxZ / sizeValue > grillZ / sizeValue) {
			grillZ *= 2;
		} else fit = true;
	}
	fit = false;
	while (!fit) {
		if (maxX / sizeValue > grillX / sizeValue) {
			grillX *= 2;
		} else fit = true;
	}
	while (!fit) {
		if (maxY / sizeValue > grillY / sizeValue) {
			grillY += (grill / 2);
		} else fit = true;
	}

	for (var key in arrayBase) {
		result.push([]);
		for (var x in arrayData) {
			x = parseInt(x);
			for (var z in arrayData[x][key]) {
				z = parseInt(z);
				var yValue = arrayData[x][key][z];
				var data = [xValues[x], yValue, zValues[z]];
				var position = [((x + 1) / (maxX + 1) * grillX) || 0, (yValue / (maxY) * grillY) || 0, ((z + 1) / (maxZ) * grillZ) || 0];
				result[key].push(new Stat(position, data));
			}
		}
	}

	var plane = [];
	var width = grillX;
	var height = grillZ;
	var vWidth = maxX + 1;
	var vHeight = (maxZ * 2) + 1;
	var count = 0;
	for (var key in arrayBase) {
		plane.push([]);
		count = 0;

		for (var w = 1; w < vWidth; w++) {
			for (var h = vHeight - 2; h > 0; h -= 2) {
				var v = (h * (vWidth + 1)) + w;
				plane[key].push(new Vertice(v, result[key][count].position[1]));
				count++;
			}
		}
	}

	var resultPlane = { "width": width, "height": height, "vWidth": vWidth, "vHeight": vHeight, "vertices": plane };


	return { stats: result, plane: resultPlane };

};

function getDates(query) {
	var initDate = new Date();
	initDate.setMinutes(1);
	initDate.setSeconds(0);
	initDate.setHours(1);
	initDate.setMilliseconds(0);

	var timeArray = [];

	if (query.month != undefined && query.month != "") {
		var size = query.month;
		initDate.setMonth(initDate.getMonth() - size);
		if (size == 0) size = 1;
		for (var i = 0; i < size; i++) {
			var endDate = _.clone(initDate);
			endDate.setMonth(endDate.getMonth() + 1);
			endDate.setMinutes(0);
			timeArray.push({ "init": _.clone(initDate), "end": endDate });
			initDate.setMonth(initDate.getMonth() + 1);
		}
	} else {
		var size = query.day || 30;

		initDate.setDate(initDate.getDate() - size);

		if (size == 0) size = 1;
		for (var i = 0; i < size; i++) {
			var endDate = _.clone(initDate);
			endDate.setHours(24);
			endDate.setMinutes(59);
			endDate.setSeconds(59);
			timeArray.push({ "init": _.clone(initDate), "end": endDate });
			initDate.setDate(initDate.getDate() + 1);

		}
	}

	return timeArray;

}


module.exports = Controller;