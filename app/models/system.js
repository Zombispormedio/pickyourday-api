var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var Immutable=require("immutable");
var chance = require("chance").Chance();

const SEED_LENGTH=15;

var SystemSchema = new Schema({

    drive:{},
    role_seeds:{
        "admin":String,
        "customer":String,
        "company_boss":String,
        "company_worker":String
    },
    test_data:{
        customers:{},
        companies:{}
    }

});


SystemSchema.statics = {

    getDriveClient:function(cb){
        var self=this;

        this.findOne({drive:{$ne:null}}, function(err, system){
            if(err)return cb(err);
            var result=system.drive;
           

            var oauth2Client = new OAuth2Client(result.CLIENT_ID, result.CLIENT_SECRET, result.REDIRECT_URL);
            oauth2Client.setCredentials(result.token);
      

            self.refreshTokensDrive(oauth2Client, system, function(err, oauth){
                
                if(err)return cb(err);
                var client={
                    drive:google.drive({ version: 'v2', auth: oauth }),
                    hostname:result.path
                };
                cb(null, client);
            });



        });
    },

    refreshTokensDrive:function(oauth, system, cb){
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

    },

    generateSeeds:function(len){
        var set = Immutable.Set();

        while (set.size < len)
            set = set.add(chance.character());

        return set.toArray().join("");
    },

    generateRoleSeeds:function(num){
        var self=this;
        var seed=self.generateSeeds;

        var set = Immutable.Set();

        while (set.size < num)
            set = set.add(seed(SEED_LENGTH));

        return set.toArray();

    },

    generateRoleCode:function(seed){

        var temp_seed = seed.split("");

        var code = "";

        while (code.length < SEED_LENGTH) {
            var random_index = chance.integer({min: 0, max: temp_seed.length - 1 });
            var letter = temp_seed[random_index];
            code += letter;

            temp_seed.splice(random_index, 1);

        }
        return code;
    },

    resetRoles:function(cb){
        var self=this;
        this.findOne({ role_seeds:{$ne:null}}, function(err, system){
            if(err)return cb(err);
            var roles=Object.keys(system.role_seeds.toObject());

            var seeds=self.generateRoleSeeds(roles.length);

            system.role_seeds=roles.reduce(function(prev, a, index){
                console.log(seeds[index].length);
                prev[a]=seeds[index];
                return prev;
            }, {});

            system.save(cb);
        });
    },
    getSeeds:function(cb){
        this.findOne({ role_seeds:{$ne:null}}, function(err, system){
            if(err)return cb(err);

            cb(null, system.role_seeds.toObject());

        });
    },

    commonToSeed:function(code, seed){
        var code_set = Immutable.Set(code.split("")).toArray().join("");

        var seed_set=Immutable.Set(seed.split("")).toArray().join("");

        return code_set===seed_set;
    }



};


module.exports = mongoose.model("System", SystemSchema);
