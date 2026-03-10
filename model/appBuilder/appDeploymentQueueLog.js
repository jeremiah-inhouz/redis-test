const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const appDeploymentQueueLogSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    logs : [{
        isScheduledDeployment : {
            type : Boolean,
            default : false
        },
        scheduledTimestamp : {
            type : Number
        },
        launchDateTime : String,
        launchTimezone : String,
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
        editDate : {
            type : Number
        },
        lastUpdatedById : {
            type : String
        },
        systemGenerated : {
            type : Boolean,
            default : false
        }
    }]
}, {
    strict : true,
    useNestedStrict : true,
    timestamps : true
});

appDeploymentQueueLogSchema.index({
    'logs.appId' : 1, companyId : 1, 
    'logs.scheduledTimestamp' : 1
});

module.exports = mongoose.model(config.appDeploymentQueueLogModel, appDeploymentQueueLogSchema, config.appDeploymentQueueLogModel);