var C=require("../config/config");

var AuthCtrl=require(C.ctrl+"auth.ctrl");

AuthCtrl.register(null, null, null, function(err){
    console.log(err);
})


/*module.exports=function(){
    
}*/
/*
var redis = require("redis"),
    client = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_AUTH
    });

client.on("error", function (err) {
    console.log("Error " + err);
    process.exit();
});

client.on("connect", function (err) {
   console.log("connected")
});


client.set("string key", "string val", redis.print);
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
    client.quit();
});*/
