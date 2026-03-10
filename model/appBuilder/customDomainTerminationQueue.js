const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const customDomainTerminationQueueSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    cloudflareId : {
        type : String,
        required : true
    },
    domain : {
        type : String,
        required : true
    },
    timestamp : {
        type : Number,
        required : true
    },
    confirmed : {
        type : Boolean,
        default : false
    }
}, {
    timestamps : true
});

customDomainTerminationQueueSchema.index({
    confirmed : 1, companyId : 1,
    timestamp : 1, domain : 1
});

module.exports = mongoose.model(config.customDomainTerminationQueueModel, customDomainTerminationQueueSchema, config.customDomainTerminationQueueModel);