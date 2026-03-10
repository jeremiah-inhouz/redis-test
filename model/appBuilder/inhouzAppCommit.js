const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const inhouzAppCommitSchema = new Schema({
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
    commitMessage : {
        type : String
    },
    compressedAppData : {
        type : String,
        required : true
    },
    createdById : {
        type : String
    },
    timestamp : {
        type : Number,
        required : true
    }
}, {
    timestamps : true,
    strict : true
});

inhouzAppCommitSchema.index({
    appId : 1, companyId : 1, variationId : 1,
    version : 1, timestamp : 1
});

module.exports = mongoose.model(
    config.inhouzAppCommitModel, 
    inhouzAppCommitSchema,
    config.inhouzAppCommitModel
);