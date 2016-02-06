var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2Client = google.auth.OAuth2;


var SystemSchema = new Schema({

    drive:{}

});


SystemSchema.statics = {

    getDriveClient:function(cb){
        var self=this;

        this.findOne({}, function(err, system){
            if(err)return cb(err);
            var result=system.drive;

            var oauth2Client = new OAuth2Client(result.CLIENT_ID, result.CLIENT_SECRET, result.REDIRECT_URL);
            oauth2Client.setCredentials(result.token);

            self.refreshTokens(oauth2Client, system, function(err, oauth){
                if(err)return cb(err);
                var client={
                    drive:google.drive({ version: 'v2', auth: oauth }),
                    hostname:result.path
                };
                cb(null, client);
            });



        });
    },

    refreshTokens:function(oauth, system, cb){
        var now=new Date();
        var expiry_date=new Date();
        if(expiry_date>now){
            return  cb(null, oauth);
        }
        oauth.refreshAccessToken(function(err, tokens) {
            if(err)return cb(err);
            system.drive.token=tokens;
            oauth.setCredentials(tokens);

            system.save(function(err){
                if(err)return cb(err);
                cb(null, oauth);
            });



        });

    }


};


module.exports = mongoose.model("System", SystemSchema);
