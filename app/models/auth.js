var C = require("../../config/config");
var Error = require(C.lib + "error")();
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var crypto = require("crypto");


var Utils = require(C.lib + "utils");

var AuthSchema = new Schema({

    email: {
        type: String,
        unique: true,
        required: true
    },

    hashed_password: {
        type: String,
        required: true
    },
    salt: String,
    role: Number,
    token: [String],
    user: Schema.ObjectId,
    developer: { access_token: String, secret_token: String },
    reset_code:String,
    social:String

});
AuthSchema.virtual('password').set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
}).get(function() {
    return this._password;
});

AuthSchema.pre("save", function(next) {
    if (!this.isNew) return next();

    if (!Utils.validatePresenceOf(this.password)) {
        next(new Error("Invalid password"));
    } else {
        next();
    }
});

AuthSchema.methods = {
    checkPassword: function(pass) {
        return this.encryptPassword(pass) === this.hashed_password;
    },
    authenticate: function(u, cb) {

        if (!this.checkPassword(u.password)) {
            return cb(Error.no_authenticate("AuthenticateAuthModel"));
        }

        var token = Utils.sign({
            email: u.email,
            role: u.role
        });
        cb(null, token);

    },


    makeSalt: function() {
        return Math.round((new Date().valueOf() * Math.random())) + "";
    },

    encryptPassword: function(password) {
        if (!password) return Error.no_data("EncryptAuthModel");
        return crypto.createHmac("sha1", this.salt).update(password).digest("hex");
    }

};


AuthSchema.statics = {

    findByToken: function(token, cb) {
        this.findOne({ email: Utils.verify(token).email, token: { "$in": [token] } }, function(err, result) {
            if (err) return cb(Error.mongo_find("FindByTokenAuthModel"));
            if (!result) return cb(Error.no_authorization("FindByTokenAuthModel"));
            cb(null, result);
        });
    },
    removeToken: function(token, cb) {
        this.findOne({ email: Utils.verify(token).email, token: { "$in": [token] } }, function(err, result) {
            if (err) return cb(Error.mongo_find("RemoveTokenAuthModel"));
            if (!result) return cb(Error.no_authorization("RemoveTokenAuthModel"));

            var index = result.token.indexOf(token);
            result.token.splice(index, 1);
            result.save(function(err) {
                if (err) return cb(Error.mongo_save("RemoveTokenAuthModel"));
                cb();
            });

        });
    }

};

module.exports.Auth = mongoose.model("Auth", AuthSchema);
