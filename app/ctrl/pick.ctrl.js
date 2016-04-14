
var C = require("../../config/config");
var async = require("async");
var PickModel = require(C.models + "pick");
var CompanyModel = require(C.models + "company");
var CustomerModel = require(C.models + "customer");
var ServiceNameModel = require(C.models + "service_name");
var CategoryModel = require(C.models + "category");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var Utils=require(C.lib+"utils");
var Controller = {};

Controller.new = function (body, cb) {
    if (!body  || !body.company || !body.initDate)
        return cb("Fields not filled");
    if(body.origin != "manual")
        if(!body.id_customer)
            return cb("Fields not filled");
        
    var date = new Date(body.initDate);

    if(date < new Date())
        return cb("Date not valid");
    var pick = new PickModel(body);
    pick.dateCreated = new Date();

    ServiceCtrl.findById(body.company.id_company, body.company.id_service, function(err, service){
        if(err) return cb(err);
        if(!service) return cb(null, "Service not found in new Pick");
        pick.duration = service.duration;
        pick.state = ["pending"];
        if(service.promotion != null){
            
            if(service.promotion.initDate <= date && service.promotion.endDate > date)
                pick.promotion = service.promotion._id;
            else pick.promotion = null;
        }
        else pick.promotion = null;
        pick.save(function (err) {
            if (err) return cb(err);
            CompanyModel.asignPick(pick.company.id_company, body.resource, pick._id, function(err){
                if(err) return cb(err);
                cb(null, pick);
            })
            
        });
    })
};

Controller.searchQuick = function (query, cb) {
    PickModel.search(query, function (err, picks) {
        if (err) return cb(err);
        if (!picks || picks.length == 0)
            return cb(null, []);
        else
            cb(null, picks);
    });
};

Controller.findByIdQuick = function (id, cb) {
    PickModel.findById(id, function (err, pick) {
        if (err) return cb(err);

        if (!pick)
            return cb("No pick found");

        cb(null, pick);

    });
};

Controller.changeState = function(pick, state, cb){
    PickModel.changeState(pick, state, function(err){
        if (err) return cb(err);
        cb();
    })
}

Controller.search = function (query, cb) {
    PickModel.search(query, function (err, picks) {
        if (err) return cb(err);

        if (!picks || picks.length == 0)
            return cb(null, []);

        async.map(picks, function (pick, next) {
            async.waterfall([
                function (callback) {
                    CustomerModel.findById(pick.id_customer, 'name surname email location', function (err, customer) {
                        if (err) return callback(err);
                        var pObj = pick.toObject();
                        delete pObj.id_customer
                        pObj.customer = customer;
                        callback(null, pObj);
                    });
                },
                function (p, callback) {
                    CompanyModel.findById(p.company.id_company, 'cif email name category promotions location phone photos ', function (err, company) {
                        if (err) return callback(err);
                        var c = company.toObject();
                        delete p.company.id_company;
                        p.service = p.company.id_service;
                     
                        p.company = c;
                        callback(null, p);
                    });
                },
                function (p, callback) {

                    CompanyModel.findServiceById(p.company._id, p.service, function (err, service) {
                      
                        if (service) {
                          
                            var s = service.toObject();          
                            p.service = s;
                            
                        }
                        callback(null, p);

                    });
                },
                function (p, callback) {
                    ServiceNameModel.findById(p.service.id_name)
                        .select('name duration keywords description')
                        .exec(function (err, service_name) {
                            if (err) return callback(err);
                            delete p.service.id_name;
                            p.service.metadata = service_name;

                            callback(null, p);
                        });
                },
                function (p, callback) {
                    CategoryModel.findById(p.company.category)
                        .select('name description icon image color')
                        .exec(function (err, category) {
                            if (err) return callback(err);

                            p.company.category = category;
                            callback(null, p);
                        });
                }
            ], function (err, result) {
                if (err) return next(err);
                next(null, result);
            });


        }, function (err, result) {
            if (err) return cb(err);
            cb(null, result);
        });
    });
};

Controller.findById = function (id, cb) {
    PickModel.findById(id, function (err, pick) {
        if (err) return cb(err);

        if (!pick)
            return cb([]);
        async.waterfall([
            function (callback) {
                CustomerModel.findById(pick.id_customer, 'name surname email location', function (err, customer) {
                    if (err) return callback(err);
                    var pObj = pick.toObject();
                    delete pObj.id_customer
                    pObj.customer = customer;
                    callback(null, pObj);
                });
            },
            function (p, callback) {
                CompanyModel.findById(p.company.id_company, 'cif email name category promotions location phone photos ', function (err, company) {
                    if (err) return callback(err);
                    var c = company.toObject();
                    delete p.company.id_company;
                    p.service = p.company.id_service;
                 
                    p.company = c;
                    callback(null, p);
                });
            },
            function (p, callback) {

                CompanyModel.findServiceById(p.company._id, p.service, function (err, service) {
                  
                    if (service) {
                      
                        var s = service.toObject();          
                        p.service = s;
                        
                    }
                    callback(null, p);

                });
            },
            function (p, callback) {
                ServiceNameModel.findById(p.service.id_name)
                    .select('name duration keywords description')
                    .exec(function (err, service_name) {
                        if (err) return callback(err);
                        delete p.service.id_name;
                        p.service.metadata = service_name;

                        callback(null, p);
                    });
            },
            function (p, callback) {
                CategoryModel.findById(p.company.category)
                    .select('name description icon image color')
                    .exec(function (err, category) {
                        if (err) return callback(err);

                        p.company.category = category;
                        callback(null, p);
                    });
            }
        ], function (err, result) {
            if (err) return cb(err);
            cb(null, result);
        });

/*
        CustomerModel.findById(pick.id_customer, 'name surname email location', function (err, customer) {
            if (err) return cb(err);
            pick.id_customer = customer;
            CompanyModel.findById(pick.company.id_company, 'cif email name category promotions locations phone photos ', function (err, company) {
                if (err) return cb(err);
                pick.company.id_company = company;
                CompanyModel.findServiceById(pick.company.id_company, pick.company.id_service, function (err, service) {
                    if (err) return cb(err);
                    var pickData = [];
                    pickData.push(pick);
                    pickData.push({ "serviceData": service });
                    cb(null, pickData);
                })
            });
        });*/
    });
};

Controller.delete = function (id, cb) {
    if (!id) return cb("Fields not Filled");

    this.findByIdQuick(id, function(Err, pick){
        var pickTemp = pick;
        PickModel.find({ _id:id }).remove().exec(function(err, result){
            if (err) return cb(err);

            if (result.result.n == 0)
                return cb("No pick deleted");

            CompanyModel.removePickAsigned(pickTemp.company.id_company, pickTemp._id, function(err){
                cb();
            });

            
        });
    })

};

Controller.formatDatePick = function(id_company, date, allDay, rangeDays, picks, state, cb){
        if(!rangeDays) rangeDays=30;
        var formatDate = [];
        var count = [];
        for (var i=0; i<rangeDays; i++){
            count.push(i);
            formatDate.push([]);
        }

        var firstDate = new Date();
        if(date)
            firstDate.setDate(date.getDate());
        if(allDay){
            firstDate.setHours(0);
            firstDate.setMinutes(0);
        }
       
        if(!date)
            date = new Date();

        var beforeInitDate = new Date();
        beforeInitDate.setDate(date.getDate());
        beforeInitDate.setHours(23);
        beforeInitDate.setMinutes(59);

        var afterInitDate = new Date();
        afterInitDate.setDate(date.getDate());
        afterInitDate.setHours(0);
        afterInitDate.setMinutes(0);

        var self = this;
        var paramsTemp = {"company.id_company":id_company};

        if(picks)
            paramsTemp.picks = picks;
        else
            paramsTemp.picks = [];
        paramsTemp=Utils.filterParams(paramsTemp);
        paramsTemp.state =state;

        async.eachSeries(count, function(day, next){ 
            if(day > 0)
                beforeInitDate.setDate(beforeInitDate.getDate()+1);
            paramsTemp.beforeInitDate = beforeInitDate;
            if(day == 0)
                paramsTemp.afterInitDate = firstDate;
            else{
                afterInitDate.setDate(afterInitDate.getDate()+1);
                paramsTemp.afterInitDate = afterInitDate;
            }

            self.search(paramsTemp,function(err, picks){    
                if(err) return next(err);
                if(picks != null && picks.length > 0)
                    for(var pick in picks)
                        formatDate[day].push({"pick":picks[pick]._id, "init":picks[pick].initDate, "duration":picks[pick].duration});  
                
                next(null, null);
            });
        }, function(err, result){
            if(err) return cb(err);           
            cb(null, formatDate);
        }); 


    };

Controller.formatDatePickCustomer = function(id_customer, initDate, endDate, cb){
    var formatDate = [];


    var self = this;
    var paramsTemp = {"id_customer":id_customer};
    paramsTemp.beforeInitDate = endDate;
    paramsTemp.afterInitDate  = initDate;
    paramsTemp.state =["active"];

    self.search(paramsTemp,function(err, picks){    
        if(err) return cb(err);
        if(picks != null && picks.length > 0)
            for(var pick in picks){
                var endDate = new Date(picks[pick].initDate);
                endDate.setMinutes(endDate.getMinutes()+picks[pick].duration);
                formatDate.push({"pick":picks[pick], "init":picks[pick].initDate, "end":endDate});  
            }
        
        cb(null, formatDate);
    });
};

Controller.clearPicks = function(cb){
    var date = new Date();

    var paramsTemp = {};
    paramsTemp.beforeInitDate = date;

    var self = this;
    self.searchQuick(paramsTemp,function(err, picks){    
        if(err) return cb(err);
        if(picks != null && picks.length > 0)
        async.map(picks, function(pick, next){
             self.changeState(pick._id, "finished", function(err){
                if(err) next(err);
                next();
             });
        }, function(err){
            if(err) return cb(err);
            cb()
        });
    });


}


module.exports = Controller;