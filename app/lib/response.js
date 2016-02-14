var Response = {};

Response.printSuccess = function(res,data){
	var keyData = {};
	keyData.data = data;
	res.jsonp(keyData);
};

Response.printError = function(res, err){
	res.send({error:err});
};


module.exports = Response;