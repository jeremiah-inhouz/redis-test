const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appBuildSchema = new Schema({
    appId : {
        type : String,
        required : true
    },
    appType : {
        type : String,
        required : true
    },
    environment : {
        type : String,
        required : true
    },
    variationId : {
        type : String,
        required : true
    },
    sizeBytes : String,
    companyId : {
        type : String,
        required : true
    },
    buildData : {
        type : String,
        required : true
    },
    hostedExternally : Boolean,
    domain : {
        type : String,
        required : true
    },
    systemUserIds : [String],
    deployedEndpointIds : [String],
    createdById : String,
    companySubdomain : String
}, {
    timestamps : true,
    strict : true
});

appBuildSchema.index({
    appId : 1, variationId : 1,
    companyId : 1, domain : 1,
    environment : 1, appType : 1
});

module.exports = mongoose.model(config.appBuildModel, appBuildSchema, config.appBuildModel)