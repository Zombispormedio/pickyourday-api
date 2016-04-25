var C = require("../../config/config");

var CompanyModel = require(C.models + "company");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var PromotionCtrl = require(C.ctrl + "promotion.ctrl");
var HistoryCtrl = require(C.ctrl + "history.ctrl");


var async = require("async");
var Utils = require(C.lib + "utils");
var _=require("lodash");
var Controller = {};

function Stat(position, data, size, color){
	this.position = position || [];
	this.size = size || [1,1,1];
	this.color = color || [1, 0, 0, 0.1];
	this.data = data || ["", 0, ""];
}

Controller.statsPicks = function(company, query, cb){
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
		function getServices(next){
			self.getServices(company,{}, function(err, services, values){
				if(err) return cb(err);
				zValues = values;
				servicesArray= services;
				next();
			})
		}, function getPicks(next){

			maxZ = servicesArray.length;
			async.eachSeries(states, function(state, subNext){
				var datesPick = [];
				async.eachSeries(timeArray, function(date, subSubNext){
					var picksServices= [];
					async.eachSeries(servicesArray, function(service, subSubSubNext){
						
						var paramsTemp = {};
						paramsTemp["company.id_service"] = service;
						paramsTemp["company.id_company"] = company;
						paramsTemp.state = state;
						paramsTemp.beforeInitDate = date.end;
						paramsTemp.afterInitDate = date.init;
						HistoryCtrl.getPicks(paramsTemp, function(err, picks){
							var count = 0;
							if(picks)
								count = picks.length;
							
							if(maxY < count)
								maxY = count;

							picksServices.push(count);

							subSubSubNext();

						})
					}, function(err){
		            	if(err) return cb(err);
		            	datesPick.push(picksServices);           
		            	subSubNext();
		        	}); 

				}, function(err){
	            	if(err) return cb(err);
	            	arrayData.push(datesPick);  
	            	subNext();
	        	}); 
			}, function(err){
            	if(err) return cb(err);    
            	next();
        	}); 
		}, function normalize(next){
			self.normalize4(timeArray, arrayData, maxX, maxY, maxZ, xValues, zValues, 100, function(err, data){
				next(null, data);
			});

		}

		],function(err, result){
        	if(err) return cb(err);  
       		cb(null, result);
    	});  
};

Controller.originPicks = function(company, query, cb){
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
		function getServices(next){
			self.getServices(company,{}, function(err, services, values){
				if(err) return cb(err);
				zValues = values;
				servicesArray= services;
				next();
			})
		}, function getPicks(next){

			maxZ = servicesArray.length;
			async.eachSeries(origins, function(origin, subNext){
				var datesPick = [];
				async.eachSeries(timeArray, function(date, subSubNext){
					var picksServices= [];
					async.eachSeries(servicesArray, function(service, subSubSubNext){
						
						var paramsTemp = {};
						paramsTemp["company.id_service"] = service;
						paramsTemp["company.id_company"] = company;
						paramsTemp.origin = [origin];
						paramsTemp.beforeInitDate = date.end;
						paramsTemp.afterInitDate = date.init;
						HistoryCtrl.getPicks(paramsTemp, function(err, picks){
							var count = 0;
							if(picks)
								count = picks.length;
							
							if(maxY < count)
								maxY = count;

							picksServices.push(count);

							subSubSubNext();

						})
					}, function(err){
		            	if(err) return cb(err);
		            	datesPick.push(picksServices);           
		            	subSubNext();
		        	}); 

				}, function(err){
	            	if(err) return cb(err);
	            	arrayData.push(datesPick);  
	            	subNext();
	        	}); 
			}, function(err){
            	if(err) return cb(err);    
            	next();
        	}); 
		}, function normalize(next){
			self.normalize4(timeArray, arrayData, maxX, maxY, maxZ, xValues, zValues, 100, function(err, data){
				next(null, data);
			});

		}

		],function(err, result){
        	if(err) return cb(err);  
       		cb(null, result);
    	}); 

}

Controller.getServices = function(company, query, cb){
	var servicesArray = [];
	var values = [];
	ServiceCtrl.search(company, {}, function(err, services){
		if(err) return cb(err);
		;
		if(services && services.length > 0){
	        servicesArray = services.map(function(a) {
	            return a._id;
	        });
	        values = services.map(function(a) {
	        	if(a.name == undefined)
	        		return a.id_name.name;
	            return a.name;
	        });
	        cb(null, servicesArray, values);

	    }else cb(-1);
	})

}

Controller.normalize4 = function(arrayBase, arrayData, maxX, maxY, maxZ, xValues, zValues, grill, cb){
	var sizeValue = 10;
	var fit = false;
	var max = maxX;
	var result = [];
	if(maxY== null)
		maxY=0;
	if(maxZ == null)
		maxZ=0;

	if(max < maxY)
		max = maxY;
	if(max < maxZ)
		max = maxZ;

	while(!fit){
		if(max/sizeValue > grill/sizeValue){
			grill *=2;
		}else fit=true;
	}

	for(var key in arrayBase){
		result.push([]);
		for(var x in arrayData){
			x = parseInt(x);
			for(var z in arrayData[x][key]){
				z = parseInt(z);
				var yValue = arrayData[x][key][z];
				var data = [xValues[x], yValue, zValues[z]];
				var position = [((x+1)/(maxX+1) *grill) || 0, (yValue/(maxY) *grill) || 0, ((z+1)/(maxZ) *grill) || 0];
				result[key].push(new Stat(position, data));

			}
			

		}
	}

	cb(null, result);


};

function getDates(query){
	var initDate= new Date();
	initDate.setMinutes(1);
	initDate.setSeconds(0);
	initDate.setHours(1);
	initDate.setMilliseconds(0);

	var timeArray = [];

	if(query.month != undefined && query.month != ""){
		var size = query.month;
		initDate.setMonth(initDate.getMonth()-size);
		if(size ==0) size=1;
		for(var i=0; i<size; i++){
			var endDate = _.clone(initDate);
			endDate.setMonth(endDate.getMonth()+1);
			endDate.setMinutes(0);
			timeArray.push({"init": _.clone(initDate), "end": endDate});
			initDate.setMonth(initDate.getMonth()+1);
		}
	}else{
		var size = query.day || 30;

		initDate.setDate(initDate.getDate() - size);

		if(size ==0) size=1;
		for(var i=0; i<size; i++){
			var endDate = _.clone(initDate);
			endDate.setHours(24);
			endDate.setMinutes(59);
			endDate.setSeconds(59);
			timeArray.push({"init": _.clone(initDate), "end": endDate});
			initDate.setDate(initDate.getDate()+1);

		}
	}

	return timeArray;

}


module.exports = Controller;