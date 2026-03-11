require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const config = require("./config/config")();
const server = http.createServer(app);
const redis = require("redis");
// const redisAdapter = require('socket.io-redis');
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

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const hpp = require("hpp");
const helmet = require("helmet");

// require("./model/user/user");
// require("./model/rolesAndPermissions/permissions");
// require("./model/rolesAndPermissions/roles");
// require("./model/user/useRoles");
// require("./model/company/company");
// require("./model/functions/function");
// require("./model/functions/deployedFunction");
// require("./model/functions/functionVersionTracker");
// require("./model/functions/operationTracker");
// require("./model/session/session");
// require("./model/appBuilder/inhouzApp");
// require("./model/appBuilder/appElements");
// require("./model/appBuilder/personalizedAppBuilderSettings");
// require("./model/appBuilder/abTests");
// require("./model/appBuilder/appElementUpdateQueue");
// require("./model/appBuilder/appPageBuild");
// require("./model/appBuilder/appPage");
// require("./model/appBuilder/pageUpdateQueue");
// require("./model/appBuilder/appUpdateQueue");
// require("./model/appBuilder/appFolder");
// require("./model/appBuilder/savedAppStyles");
// require("./model/appBuilder/styleGuide");
// require("./model/appBuilder/externalUserEditorAccessLog");
// require("./model/appBuilder/appAccessPasswords");
// require("./model/appBuilder/appBuilderSocketTracker");
// require("./model/appBuilder/savedAppElements");
// require("./model/appBuilder/appDeploymentQueue");
// require("./model/appBuilder/appDeploymentQueueLog");
// require("./model/appBuilder/appBuild");
// require("./model/appBuilder/appBuildReport");
// require("./model/appBuilder/inhouzAppCommit");
// require("./model/appBuilder/appRebaseFallbackLog");
// require("./model/webComponent/webComponentAccessTracker");
// require("./model/inhouzSubscription/inhouzSubscription");
// require("./model/appBuilder/customDomainLog");
// require("./model/appBuilder/customDomainTerminationQueue");
// require("./model/staticFiles/staticBase64File");
// require("./model/inhouzSign/inhouzSignStaticFiles");
// require("./model/system/systemUser");
// require("./model/subscription/subscriber");
// require("./model/subscription/subscription");
// require("./model/subscription/subscriptionService");
// require("./model/inhouzCloudStorage/inhouzCloudStorageFiles");
// require("./model/fileStorageService/fileStorageServices");
// require("./model/inhouzSign/inhouzSignDoc");
// require("./model/inhouzSign/inhouzSignTemplate");
// require("./model/queryTracker/queryKeyTracker");
// require("./model/pdfGenerator/pdfGeneratorTemplate");

app.use(
    cors({
        origin: /inhouz.localhost/,
        credentials: true,
        methods: "GET,PUT,POST,DELETE",
    }),
);

app.use(bodyParser.json({ limit: "300mb" }));
app.use(hpp()); //prevent http parameter pollution attacks
app.use(helmet());
app.use(cookieParser(config.sessionSecret));

const getSocketIoInstance = function() {
    return io;
};
module.exports.getSocketIoInstance = getSocketIoInstance;

// require("./controller/appBuilder/appBuilderRoutes")(app);
if (![1, 2].includes(mongoose.connection.readyState)) {
    connectMongo();
}
process.setMaxListeners(0);
mongoose.connection.on("connected", () => {
    console.log("Database connection confirmed");
});
mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected. Reconecting...");
    if (![1, 2].includes(mongoose.connection.readyState)) {
        setTimeout(() => {
            connectMongo();
        }, 5000);
    }
});
mongoose.connection.on("error", (err) => {
    console.log("Database error occured", err);
});
process.on("SIGINT", shutdownFunction);
process.on("SIGTERM", shutdownFunction);
// process.on('SIGKILL', shutdownFunction);
process.on("uncaughtException", shutdownFunction);
function shutdownFunction(e) {
    console.log("shutdown error", e);
    // pubClient.quit();
    if (mongoose.connection.close) {
        mongoose.connection.close();
    }
}

server.listen(process.env.PORT, () => {
    console.log(`App is running on port ${process.env.PORT}`);
});

function connectMongo() {
    mongoose.connect(
        config.mongoUrl,
        {
            // useNewUrlParser : true,
            // useCreateIndex: true,
            // useUnifiedTopology : true,
            // poolSize : 1,
            maxPoolSize: 1,
        },
        console.log("Connected to Database"),
    );
}
