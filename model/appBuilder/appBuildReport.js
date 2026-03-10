const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appBuildReportSchema = new Schema({
    appId : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    appType : String,
    hostedExternally : Boolean,
    domain : {
        type : String
    },
    customDomains : [{
        domain : {
            type : String,
            // index : true
        }
    }],
    deployDate : {
        type : Number,
        required : true
    },
    appType : {
        type : String,
        required : true
    },
    abTestId : String,
    variationBuildReport : [{
        variationId : String,
        success : Boolean,
        version : Number,
        sizeBytes : Number
    }],
    buildSizeBytes : Number,
    createdById : String,
    functionIds : [String],
    environment : {
        type : String,
        default : 'development',
        enum : ['development', 'test', 'production']
    },
    compressedAppVariationDataMap : {
        type : String
    },
    compressedAppVariationDataMapRedisKey : { //if stored on redis
        type : String
    },
    systemUserIds : [String],
    deployedEndpointIds : [String],
    isRedisApp : {
        type : Boolean,
        default : false
    },
    redisCacheKeys : [String]
}, {
    strict : true,
    timestamps : true
});

appBuildReportSchema.index({
    appId : 1, companyId : 1, 
    domain : 1, hostedExternally : 1,
    deployDate : 1, buildSizeBytes : 1,
    'variationBuildReport.variationId' : 1,
    appType : 1, environment : 1
});

module.exports = mongoose.model(config.appBuildReportModel, appBuildReportSchema, config.appBuildReportModel)