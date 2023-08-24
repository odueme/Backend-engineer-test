
const redis = require('redis')

export const redisClient = redis.createClient()



console.log("Connecting to redis")


redisClient.on('error', ()=>{
    console.log('Error in the Connection')
})

async function Connect(){
    try {
        await redisClient.connect();
        console.log("Connected")
    } catch (err) {
        console.error('Error while connecting to Redis:', err);
    }
}

Connect()
