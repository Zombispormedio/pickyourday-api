var C=require("../config/config");

var SystemCtrl = require(C.ctrl + "system.ctrl");
module.exports=function(){
    var code="1VXqYm*n8[M!GBW";
    SystemCtrl.verifyRoleCode(code, function(_,role){
        console.log(role);
    });



};



/**** ResetRolesSeeds
var SystemModel = require(C.models + "system");
    SystemModel.resetRoles(function(err, result){
        if(err) return console.log(err);
        console.log(result);
    });
***/
