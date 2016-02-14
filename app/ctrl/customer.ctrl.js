
var C = require("../../config/config");
var PickCtrl = require(C.ctrl + "pick.ctrl");
var AuthCtrl = require(C.ctrl + "auth.ctrl");
var EventCtrl = require(C.ctrl + "event.ctrl");
var PrePickCtrl = require(C.ctrl + "prePick.ctrl");
var CompanyCtrl = require(C.ctrl + "company.ctrl");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var CategoryCtrl = require(C.ctrl + "category.ctrl");
var CustomerModel = require(C.models + "customer");
var PickModel = require(C.models+"pick");
var async = require("async");
var Controller = {};



Controller.newUser = function (body, cb) { //datos del body, callback

    if (!body || !body.email || !body.password) return cb("Fields not Filled");

    var customer = new CustomerModel(body);
    customer.registerDate = new Date();
    customer.save(function (err, result) {
        if (err) return cb(err);

        cb(null, result);
    });
};

Controller.search = function (query, cb) {
    CustomerModel.search(query, function (err, customers) {
        if (err) return cb(err);

        if (!customers)
            return cb(null, "No users");

        cb(null, customers);

    });
};

Controller.findById = function (id, cb) {
    CustomerModel.findById(id, function (err, customer) {
        if (err) return cb(err);

        if (!customer)
            return cb(null, "No user");

        return cb(null, customer);
    });
}

Controller.modify = function (id, body, cb) {

    if (!body || !id)
        return cb("Fields not filled");

    CustomerModel.modify(id, body, function (err) {
        if (err) return cb(err);
        cb();
    });
}

Controller.delete = function (id, cb) {

    if (!id) return cb("Fields not Filled");

    async.waterfall([
        function getCustomer(next) {
            CustomerModel.findOne({ _id: id }, function (err, customer) {

                if (err) return next(err);

                if (!customer)
                    return next(null, "No customer");


                next(null, customer);

            });
        }, function getPicks(customer, next){
            PickModel.find({id_customer:customer._id}, function(err, picks){
               next(null, customer, picks); 
            });
            
        },function deletePicks(customer, picks, next){
            
            if(picks &&picks.length>0){
               async.eachSeries(picks, function iterator(item, n){
                   item.remove(function(){
                       n();
                   });
                   
               }, function done(){
                   next(null, customer);
               })
            }else{
                next(null, customer);
            }
            
            
        },function unableAccess(customer, next) {

            AuthCtrl.UnableAccess(customer.email, function (err) {
                if (err) return next(err);
                next(null, customer);
            });

        }, function deleteCustomer(customer, next) {
            customer.remove(function (err) {
                if(err)return next();
                    next();
            });
        }

    ], function (err, data) {
        if (err) return cb(err);
        cb(null, "Customer deleted");
    });
}

Controller.searchThings = function(params, cb){
    things = {};
    things["prepicks"] = {};
    things["companies"] = {};
    //busca por nombre de empresa

    //busca por keywords
    things["services"] = {};
    //busca por nombre de servicios y luego por keywords
    /*ServiceCtrl.search(0, params, function(err, services){
        if(err) return cb(err);
        things["services"] = services;
        cb(null, things);
    });*/
    async.waterfall([
        function getDefaultName(callback) {
            ServiceCtrl.searchServiceName(params, function(err, default_names){
                if(err) return callback(err);
                callback(null, things, default_names);
            });
        }, function getServicesByDefaultName(things, names, callback){
            var idDefaultNames;
            if(names && names.length > 0)
                idDefaultNames = names.map(function(a){  
                    return a._id;
                });
            async.map(idDefaultNames, function(idDefaultName, next){
                var query = {"id_name":idDefaultName};
                ServiceCtrl.search(0,query, function(err, services){
                    if(err) return next(err);
                    if(services != "Services not found"){
                        return next(null, services);
                    }                        
                    next();
                })
            }, function(err, result){
                if(err) return callback(err);
                for(var i=0; i<result.length; i++)
                    if(result[i] != null)
                        things.services = result[i];
                callback(null, things);
            }) 
        }
    

     ], function (err, data) {
        if (err) return cb(err);
        cb(null, data);
    });

    //busca por keywords



    
}

//****************PICKS
Controller.searchPick = function (customer, params, cb) {
    params["id_customer"] = customer;
    PickCtrl.search(params, cb);
}

Controller.newPick = function (customer, params, cb) {
    params["id_customer"] = customer;
    PickCtrl.new(params, cb);
}

Controller.deletePick = function (id, cb) {
    PickCtrl.delete(id, cb);
}

Controller.getPickById = function (id, cb) {
    PickCtrl.findById(id, cb);
}

//***************EVENTS
Controller.searchEvent = function (customer, params, cb) {
    EventCtrl.search(customer, params, cb);
}

Controller.newEvent = function (customer, params, cb) {
    EventCtrl.new(customer, params, cb);
}

Controller.modifyEvent = function (customer, params, cb) {
    EventCtrl.modify(customer, params, cb);
}

Controller.deleteEvent = function (customer, params, cb) {
    EventCtrl.delete(customer, params, cb);
}

Controller.getEventById = function (customer, id, cb) {
    EventCtrl.findById(customer, id, cb);
}

//******************PREPICKS
Controller.searchPrePick = function (customer, params, cb) {
    PrePickCtrl.search(customer, params, cb);
}

Controller.deletePrePick = function (customer, params, cb) {
    PrePickCtrl.delete(customer, params, cb);
}

Controller.getPrePickById = function (customer, id, cb) {
    PrePickCtrl.findById(customer, id, cb);
}


//******************REVIEW
Controller.newReviewCompany = function (customer, params, cb) {
    CompanyCtrl.newReview(customer, params, cb);
}

Controller.newRateService = function (customer, params, cb) {
    CompanyCtrl.newRateService(customer, params, cb);
}


//*******************CATEGORY
Controller.searchCategory = function (params, cb) {
    CategoryCtrl.search(params, cb);
}


Controller.rollback = function (id) {
    CustomerModel.findById(id, function (err, customer) {
        customer.remove();
    });
}


//******************SEARCH
Controller.searchService = function (params, cb) {
    if (!params.id_company)
        ServiceCtrl.search(0, params, cb);
    else
        ServiceCtrl.search(params.id_company, params, cb);
}

Controller.getServiceById = function (params, id, cb) {
    if (!params || !params.id_company)
        return cb("Fields not filled");
    ServiceCtrl.findById(params.id_company, id, cb);
}

Controller.searchCompany = function (params, cb) {
    CompanyCtrl.search(params, cb);
}

Controller.getCompanyById = function (id, cb) {
    CompanyCtrl.findById(id, cb);
}




module.exports = Controller;