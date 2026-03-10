const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const inhouzAppRebaseFallbackLogSchema = new Schema({
    appId : {
        type : String,
        required : true
    },
    appType : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    variationId : {
        type : String,
        required : true
    },
    version : {
        type : Number,
        required : true
    },
    compressedAppData : {
        type : String,
        required : true
    },
    timestamp : {
        type : Number,
        required : true
    }
}, {
    timestamps : true,
    strict : true
});

inhouzAppRebaseFallbackLogSchema.index({
    appId : 1, companyId : 1, variationId : 1,
    version : 1, timestamp : 1
});

module.exports = mongoose.model(
    config.inhouzAppRebaseFallbackLogModel, 
    inhouzAppRebaseFallbackLogSchema,
    config.inhouzAppRebaseFallbackLogModel
);