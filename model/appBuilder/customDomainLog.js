const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const customDomainLogSchema = new Schema({
    appId : {
        type : String,
        required : true
    },
    domain : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    cloudflareId : {
        type : String,
        required : true
    },
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
    activity : {
        type : String,
        required : true,
        enum : ['activate', 'deactivate']
    }
}, {
    timestamps : true
});

customDomainLogSchema.index({
    appId : 1, domain : 1, 
    companyId : 1, activity : 1,
    cloudflareId : 1
});

module.exports = mongoose.model(config.customDomainLogModel, customDomainLogSchema, config.customDomainLogModel);