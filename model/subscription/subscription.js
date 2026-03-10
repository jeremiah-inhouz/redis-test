const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const subscriptionSchema = new Schema({
    subscriberEmail : {
        type : String,
        required : true,
        index : true,
        validate : {
            validator : (value) => {
                return validator.isEmail(value)
            },
            message : '{VALUE} is not a valid email'
        }
    },
    companyId : {
        type : String,
        required : true
    },
    subscriptionType : {
        type : String,
        required : true,
        enum : [
            'recurring',
            'oneTime', 'payAsYouGo'
        ]
    },
    assetOwnerCompanyId : {
        type : String,
        required : true
    },
    subscriptionServiceId : {
        type : String,
        required : true
    },
    subscriptionServiceTierId : {
        type : String,
        required : true
    },
    serviceType : {
        type : String,
        required : true,
        enum : ['internal', 'external']
    },
    reupSubscriptionRateType : {
        type : String,
        required : true,
        default : 'month',
        enum : ['day', 'week', 'month', 'year']
    },
    reupSubscriptionRate : {
        type : Number
    },
    reupSubscriptionRateTypeCount : {
        type : Number,
        required : true,
        default : 1
    },
    reupDate : {
        type : Number
    },
    lastReupDate : {
        type : Number
    },
    autoReup : {
        type : Boolean,
        default : true
    },
    isLifetime : {
        type : Boolean,
        index : true
    },
    autoReupExtentionDays : {
        type : Number,
        default : 30
    },
    reupTotalPings : {}, //number or unlimited
    pingUsageCount : {
        type : Number,
        default : 0
    },
    hasDailyPingLimit : {
        type : String,
        default : false
    },
    dailyPingLimit : {
        type : Number,
        default : 0
    },
    dailyPingUsageCount : {
        type : Number,
        default : 0
    },
    dailyPingUsageDatestamp : {
        type : Number,
        default : 0
    },
    allowPingOverage : {
        type : Boolean,
        default : false
    },
    pingOverageCount : Number,
    limitReached : {
        type : Boolean,
        default : false
    },
    encryptedApiKey : {
        type : String
    },
    environment : {
        type : String,
        required : true,
        enum : ['development', 'test', 'production']
    },
    activeSubscriber : { 
        type : Boolean,
        default : true
    },
    activationDate : Number,
    signedUpByEmail : {
        type : String,
        required : true,
        index : true,
        validate : {
            validator : (value) => {
                return validator.isEmail(value)
            },
            message : '{VALUE} is not a valid email'
        }
    },
    assetType : {
        type : String,
        required : true,
        enum : ['view', 'api']
    },
    assetIds : [String],
    openPaymentIntent : {
        type : Boolean,
        default : false
    },
    currency : {
        type : String,
        default : 'USD'
    },
    serviceMigrationScheduledDate : Number,
    serviceMigrationScheduled : {
        type : Boolean,
        default : false
    },
    serviceMigrationOccured : {
        type : Boolean,
        default : false
    },
    serviceMigrationEventDate : {
        type : Number
    },
    previousTierId : {
        type : String
    },
    migrationSubscriptionTierId : {
        type : String
    },
    migrationSusbriptionServiceId : {
        type : String
    },
    hasAddonPackages : {
        type : Boolean,
        default : false
    },
    addonPackageIds : [String],
    lastUpdatedByEmail : {
        type : String
    },
    subscribedPackageIds : [String],
    editDate : {
        type : Number
    },
    createdDate : {
        type : Number,
        required : true
    },
    createdByEmail : {
        type : String
    },
    deactivationDate : {
        type : Number
    },
    status : {
        type : String,
        default : 'active',
        enum : ['active', 'paused', 'inRenewal', 'cancelled']
    }
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

subscriptionSchema.index({
    subscriberUserId : 1, assetOwnerCompanyId : 1,
    subscriptionServiceId : 1, subscriptionServiceTierId : 1,
    reupSubscriptionRateType : 1, companyId : 1,
    limitReached : 1, environment : 1, activeSubscriber : 1,
    serviceType : 1, isLifetime : 1,
    assetId : 1, assetType : 1, status : 1, allowPingOverage : 1
});

module.exports = mongoose.model(config.subscriptionModel, subscriptionSchema, config.subscriptionModel)