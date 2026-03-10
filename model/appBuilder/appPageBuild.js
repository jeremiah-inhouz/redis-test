const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appPageBuildSchema = new Schema({
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
    pageId : {
        type : String,
        required : true
    },
    pageSlug : {
        type : String,
        default : ''
    },
    variationId : {
        type : String,
        required : true
    },
    sizeBytes : Number,
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
        type : String
    },
    systemUserIds : [String],
    deployedEndpointIds : [String],
    createdById : String,
    companySubdomain : String,
    isRootPage : Boolean,
    is404Page : Boolean,
    notFoundPageId : String,
    redisKey : String,
    pageFunctionIds : [String]
}, {
    timestamps : true,
    strict : true
});

appPageBuildSchema.index({
    appId : 1, variationId : 1,
    companyId : 1, domain : 1,
    environment : 1, appType : 1,
    pageId : 1, pageSlug : 1
});

module.exports = mongoose.model(config.appPageBuildModel, appPageBuildSchema, config.appPageBuildModel)