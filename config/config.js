const path = require("path");
const fs = require("fs");

function readSecret(name, envFallback) {
    const secretsPath = process.env.SECRETS_PATH || "/mnt/secrets";
    const filePath = path.join(secretsPath, name);
    try {
        return fs.readFileSync(filePath, "utf8").trim();
    } catch {
        return process.env[envFallback] || "";
    }
}

module.exports = () => {
    return {
        redisHost: readSecret("redishost", "REDIS_HOST"),
        redisPassword: readSecret("redispassword", "REDIS_PASSWORD"),
        redisDB: process.env.REDIS_DB,
    };
};
