require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const config = require("./config/config")();
const server = http.createServer(app);
const redis = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

let redisUrl = `redis://default:${config.redisPassword}@${config.redisHost}:${process.env.REDIS_PORT}`;
if (config.redisDB) {
    redisUrl = redisUrl + `/${config.redisDB}`;
}

console.log("REDIS URL:", redisUrl.replace(config.redisPassword, "****"));

const pubClient = redis.createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

pubClient.on("error", (e) => console.log("pubClient error:", e.message));
subClient.on("error", (e) => console.log("subClient error:", e.message));

let io = require("socket.io")(server, {
    path: "/redistest/socket.io",
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Redis connected and socket.io adapter set successfully");
    })
    .catch((e) => {
        console.log("Redis Promise.all failed:", e.message);
    });

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
