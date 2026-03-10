const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appBuilderSocketTrackerSchema = new Schema({
    userId : {
        type : String
    },
    companyId : {
        type : String
    },
    appId : {
        type : String,
        required : true
    },
    variationId : {
        type : String,
        required : true
    },
    socketId : {
        type : String,
        required : true
    },
    timestamp : {
        type : Number,
        required : true
    },
    builderId : {
        type : String,
        required : true
    },
    room : {
        type : String,
        required : true
    },
    firstName : String,
    lastName : String,
    serverId : {
        type : String,
        required : true
    },
    bgColor : String
}, {
    timestamps : true,
    strict : true
});

appBuilderSocketTrackerSchema.index({
    room : 1,
    timestamp : 1, serverId : 1,
    userId : 1, variationId : 1,
    appId : 1, socketId : 1
});

module.exports = mongoose.model(config.appBuilderSocketTrackerModel, appBuilderSocketTrackerSchema, config.appBuilderSocketTrackerModel)