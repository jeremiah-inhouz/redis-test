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
let subClient = pubClient.duplicate();

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
});

module.exports.redisClient = pubClient;

// 👇 STEP 1: Just mongoose, no models yet
const mongoose = require("mongoose");

function connectMongo() {
    mongoose.connect(
        config.mongoUrl,
        { maxPoolSize: 1 },
        console.log("Connected to Database"),
    );
}

mongoose.connection.on("connected", () =>
    console.log("Database connection confirmed"),
);
mongoose.connection.on("error", (err) =>
    console.log("Database error occured", err),
);

if (![1, 2].includes(mongoose.connection.readyState)) {
    connectMongo();
}

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        redis: pubClient.isReady ? "connected" : "disconnected",
    });
});

server.listen(process.env.PORT || 5099, () => {
    console.log(`App is running on port ${process.env.PORT || 5099}`);
});
