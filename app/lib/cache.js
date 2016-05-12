var redis = require("redis"),
    client = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
         password: process.env.REDIS_AUTH
    }),
    apicache = require("apicache").options({
        redisClient: client, debug: true, enabled: false
    }).middleware;

client.on("error", function (err) {
    console.log("Error " + err);
});



module.exports = function (time) {
    return apicache(time);
}