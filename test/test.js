var C=require("../config/config");
var SystemModel = require(C.models + "system");

module.exports=function(){
    var seed="B#c$DhMOqRTu7X[";
    var code=SystemModel.generateRoleCode(seed);

    console.log(SystemModel.commonToSeed(code, seed));

};



/**** ResetRolesSeeds
    SystemModel.resetRoles(function(err, result){
        if(err) return console.log(err);
        console.log(result);
    });
***/
