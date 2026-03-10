const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const appDeploymentQueueSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    isScheduledDeployment : {
        type : Boolean,
        default : false
    },
    scheduledTimestamp : {
        type : Number
    },
    launchDateTime : String,
    launchTimezone : String,
    commitMessage : String,
    activeVersionMap : {},
    deployed : {
        type : Boolean,
        default : false
    },
    approvalRequired : {
        type : Boolean,
        default : false
    },
    numberOfRequiredApprovals : {
        type : Number
    },
    approvedCount : {
        type : Number,
        default : 0
    },
    approvals : [{
        email : {
            type : String,
            validate : {
                validator : (value) => {
                    return validator.isEmail(value)
                },
                message : '{VALUE} is not a valid email'
            }
        },
        firstName : String,
        lastName : String,
        createdDate : {
            type : Number,
            required : true
        },
        versionMap : {},
        comment : String
    }],
    rejections : [{
        email : {
            type : String,
            validate : {
                validator : (value) => {
                    return validator.isEmail(value)
                },
                message : '{VALUE} is not a valid email'
            }
        },
        firstName : String,
        lastName : String,
        createdDate : {
            type : Number,
            required : true
        },
        comment : {
            type : String
        },
        versionMap : {}
    }],
    compressedAppVariationDataMap : String,
    compressedAppVariationDataMapRedisKey : String,
    editDate : {
        type : Number
    },
    lastUpdatedById : {
        type : String
    },
    cachedCookieString : String,
    cachedCsrfToken : String,
    systemGenerated : {
        type : Boolean,
        default : false
    },
    environment : {
        type : String,
        default : 'development',
        enum : ['development', 'test', 'production']
    }
}, {
    strict : true,
    useNestedStrict : true,
    timestamps : true
});

appDeploymentQueueSchema.index({
    appId : 1, companyId : 1, 
    isScheduledDeployment : 1, deployed : 1,
    scheduledTimestamp : 1
});

module.exports = mongoose.model(config.appDeploymentQueueModel, appDeploymentQueueSchema, config.appDeploymentQueueModel);