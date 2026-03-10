require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const config = require("./config/config")();
const server = http.createServer(app);
const redis = require("redis");

const { createAdapter } = require("@socket.io/redis-adapter");
let redisUrl = `redis://default:${config.redisPassword}@${config.redisHost}:${process.env.REDIS_PORT}`;
// const os = require('os');
// let redisOptions = {
//     host: process.env.REDIS_HOST,
//     password : process.env.REDIS_PASSWORD,
//     port : Number(process.env.REDIS_PORT),
// }
if (config.redisDB) {
    // redisOptions['db'] = config.redisDB;
    redisUrl = redisUrl + `/${config.redisDB}`;
}

// Log redis url
console.log("REDIS URL:", redisUrl.replace(config.redisPassword, "****"));

// Simulate heavy synchronous startup work
function blockEventLoop() {
    const start = Date.now();
    while (Date.now() - start < 300000) { } // block for 3 seconds
}

blockEventLoop(); // call before redis connects

// let pubClient = redis.createClient(redisOptions);
const pubClient = redis.createClient({ url: redisUrl });
let subClient = pubClient.duplicate();

// Trying redis fix
pubClient.on("error", (e) => console.log("pubClient error", e.message));
subClient.on("error", (e) => console.log("subClient error", e.message));

let io = require("socket.io")(server, {
    path: "/appbuildersocket/socket.io",
    cors: {
        origin: /inhouz.localhost/,
        methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 100000000,
});
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    // io.listen(3000);
});
// io.adapter(redisAdapter({ pubClient, subClient }));
// pubClient.on('error', (err) => {
//     console.log('pubClient error', err)
//     process.exit(1);
// })

module.exports.redisClient = pubClient;

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        redis: pubClient.isReady ? "connected" : "disconnected",
    });
});

process.on("SIGINT", shutdownFunction);
process.on("SIGTERM", shutdownFunction);
process.on("uncaughtException", (e) => {
    console.log("uncaughtException:", e.message);
    if (e.name !== "ConnectionTimeoutError") {
        shutdownFunction(e);
    }
});

function shutdownFunction(e) {
    console.log("shutdown error", e);
    process.exit(1);
}

server.listen(process.env.PORT || 5099, () => {
    console.log(`App is running on port ${process.env.PORT || 5099}`);
});
