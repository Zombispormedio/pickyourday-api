var C = require("../../config/config");

var mongoose = require("mongoose");
var Schema = mongoose.Schema;


var GeolocationType = require("./customType.js").GeolocationSchema;
var Utils = require(C.lib + "utils");

var EventSchema = new Schema({
    initDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    name: {
        type: String
    },
    description: {
        type: String
    },
    dateCreated: Date
});

var PrepickSchema = new Schema({
    date: {
        type: Date
    },
    company: {
        id_company: {
            type: Schema.ObjectId,
            ref: "Company"
        },
        id_service: {
            type: Number
        }
    },
    dateCreated: Date
});

var CustomerSchema = new Schema({
    preferences: [{
        question: Schema.ObjectId,
        answer:{}
    }],
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,

    },
    surname: {
        type: String,

    },
    birthDate: {
        type: Date,

    },
    location: {
        country: String,
        currentLocation: GeolocationType,
        geolocation: [GeolocationType],
    },
    events: [EventSchema],
    prepicks: [PrepickSchema],
    registerDate: Date,
    lastAccess: Date,
    lastUpdate: Date
    

});


CustomerSchema.statics = {
    search: function (params, cb) { //en params no meter id, todos los demas datos si
        var query = this.find({});
        for (var key in params) {

            switch (key) {
                case 'beforeBirthDate':
                    query.where('birthDate').lt(params[key]);
                    break;
                case 'afterBirthDate':
                    query.where('birthDate').gt(params[key]);
                    break;

                case 'beforeRegister':
                    query.where('registerDate').lt(params[key]);
                    break;
                case 'afterRegister':
                    query.where('registerDate').gt(params[key]);
                    break;

                case 'beforeLastUpdate':
                    query.where('lastUpdate').lt(params[key]);
                    break;
                case 'afterLastUpdate':
                    query.where('lastUpdate').gt(params[key]);
                    break;

                case 'beforeAccess':
                    query.where('lastAccess').lt(params[key]);
                    break;
                case 'afterAccess':
                    query.where('lastAccess').gt(params[key]);
                    break;
                default: query.where(key).equals(Utils.like(params[key]));

            }

        }

        query.exec(cb);

    },

    newEvent: function (user, params, cb) {
        this.findOneAndUpdate({ _id: user }, { $push: { "events": {} } }, { safe: true, upsert: true, new: true }, function (err, customer) {
            if (err) return cb(err);
            if (!customer) return cb("User not found");
            var event = customer.events[customer.events.length - 1];
            event.name = params.name;
            event.initDate = params.initDate;
            event.endDate = params.endDate;
            event.description = params.description;
            event.dateCreated = new Date();
            customer.save(function (err) {
                if (err) return cb(err);
                cb();
            });


        });
    },

    searchEvent: function (user, params, cb) {

        var query = this.aggregate([{ $unwind: "$events" }, { $match: { _id: user } }]);

        for (var key in params) {
            switch (key) {
                case 'beforeInitDate':
                    query.match({ 'events.initDate': { '$lte': new Date(params[key]) } }); //en agregate para trabajar con las fechas pide un objeto date,no es como find		
                    break;
                case 'afterInitDate':
                    query.match({ 'events.initDate': { '$gte': new Date(params[key]) } });
                    break;
                case 'beforeEndDate':
                    query.match({ 'events.endDate': { '$lte': new Date(params[key]) } });
                    break;
                case 'afterEndDate':
                    query.match({ 'events.endDate': { '$gte': new Date(params[key]) } });
                    break;
                case 'beforeDateCreated':
                    query.match({ 'events.dateCreated': { '$lte': new Date(params[key]) } });
                    break;
                case 'afterDateCreated':
                    query.match({ 'events.dateCreated': { '$gte': new Date(params[key]) } });
                    break;
                default:
                    var field = "events." + key;
                    var match = {};
                    match[field] = Utils.like(params[key]);
                    query.match(match);
            }
        }


        query.exec(function (err, customersEvent) {
            var events = customersEvent.map(function (a) {
                return a.events;
            });
            cb(null, events);
        });

    },

    findEventById: function (user, id, cb) {

        this.findOne({ _id: user }, function (err, customer) {
            if (err) return cb(err);

            if (!customer)
                return cb("Customer not found");

            var event = customer.events.id(id);
            if (!event)
                return cb("Event not found");
            cb(null, event);

        });
    },

    modifyEvent: function (user, id, params, cb) {
        this.findOne({ _id: user }, function (err, customer) {
            if (err) return cb(err);

            if (!customer)
                return cb("Customer not found");
            var event = customer.events.id(id);
            if (!event)
                return cb("Event not found");
            for (var key in params) {
                event[key] = params[key];
            }

            customer.lastUpdate=new Date();
            customer.save(function (err) {
                if (err) return cb(err);
                cb();
            });

        });
    },

    deleteEvent: function (user, id, cb) {
        this.findOne({ _id: user }, function (err, customer) {
            if (err) return cb(err);

            if (!customer)
                return cb("Customer not found");

            if (!customer.events.id(id))
                return cb("Event not found");

            customer.lastUpdate=new Date();
            customer.events.id(id).remove();
            customer.save(function (err) {
                if (err) return cb(err);
                cb();
            });
        });
    },

    newPrePick: function (customerEmail, params, cb) {
        this.findOneAndUpdate({ email: customerEmail }, { $push: { "prepicks": {} } }, { safe: true, upsert: true, new: true }, function (err, customer) {
            if (err) return cb(err);

            var prePick = customer.prepicks[customer.prepicks.length - 1];
            prePick.date = params.date;
            prePick.company.id_service = params.id_service;
            prePick.company.id_company = params.id_company;
            prePick.dateCreated = new Date();
            customer.save(function (err) {
                if (err) return cb(err);
                cb();
            });
        });
    },

    searchPrePick: function (user, params, cb) {
        var query;
        if (user != 0)
            query = this.aggregate([{ $unwind: "$prepicks" }, 'name surname email', { $match: { _id: user } }]);
        else
            query = this.aggregate([{ $unwind: "$prepicks" }]);

        for (var key in params) {
            switch (key) {
                case 'beforeDate':
                    query.match({ 'prepicks.date': { '$lte': new Date(params[key]) } });
                    break;
                case 'afterDate':
                    query.match({ 'prepicks.date': { '$gte': new Date(params[key]) } });
                    break;
                case 'beforeDateCreated':
                    query.match({ 'prepicks.dateCreated': { '$lte': new Date(params[key]) } });
                    break;
                case 'afterDateCreated':
                    query.match({ 'prepicks.dateCreated': { '$gte': new Date(params[key]) } });
                    break;
                default:
                    var field = "prepicks." + key;
                    var match = {};
                    match[field] = params[key];
                    query.match(match);
            }
        }


        query.exec(function (err, customersPrePick) {
            if (user !== 0) {
                var prePicks = customersPrePick.map(function (a) {
                    return a.prepicks;
                });
                return cb(null, prePicks);
            }
            cb(null, customersPrePick);

        });

    },

    findPrePickById: function (user, id, cb) {

        this.findOne({ _id: user }, function (err, customer) {
            if (err) return cb(err);

            if (!customer)
                return cb("Customer not found");

            var prePick = customer.prepicks.id(id);
            if (!prePick)
                return cb("Event not found");
            cb(null, prePick);

        });
    },

    deletePrePick: function (user, id, cb) {
        this.findOne({ _id: user }, function (err, customer) {
            if (err) return cb(err);

            if (!customer)
                return cb("Customer not found");

            if (!customer.prepicks.id(id))
                return cb("PrePick not found");

            customer.prepicks.id(id).remove();
            customer.save(function (err) {
                if (err) return cb(err);
                cb();
            });
        });
    },
    modify: function (id, params, cb) {
        this.findById(id, function (err, customer) {
            if (err) return cb(err);

            if (!customer)
                return cb("Customer not found");


            customer = Utils.mergeMongoObjects(customer, params);
            customer.lastUpdate = new Date();

            customer.save(function (err) {
                if (err) return cb(err);
                cb();
            });

        });
    }


}




module.exports = mongoose.model("Customer", CustomerSchema);