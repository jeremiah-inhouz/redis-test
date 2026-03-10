const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const inhouzSubscriptionSchema = new Schema({
    serviceType : {
        type : String,
        required : true,
        enum : ['custom', 'default']
    },
    active : {
        type : Boolean,
        default : true
    },
    cancellationReason : {
        type : String,
        enum : ['', 'switchOff', 'planMigration']
    },
    deactivationDate : {
        type : Number
    },
    companyId : {
        type : String,
        required : true
    },
    currency : {
        type : String,
        default : 'USD'
    },
    signupDateTimestamp : {
        type : Number,
        required : true
    },
    cohort : {
        type : String,
        required : true
    },
    subscriptionDurationType : {
        type : String,
        required : true,
        enum : ['month', 'year']
    },
    subscriptionRenewalDayIntervalCount : {
        type : Number,
        required : true,
        enum : [30, 360]
    },
    subscriptionRenewalDate : {
        type : Number,
        required : true
    },
    utilityRenewalDate : {
        type : Number,
        required : true
    },
    lastSubscriptionRenewalDate : Number,
    lastUtilityRenewalDate : Number,
    subscriptionServiceId : {
        type : String,
        required : true
    },
    subscriptionServiceTierId : {
        type : String,
        required : true
    },
    subscriptionServiceName : {
        type : String
    },
    subscriptionServicePlanName : {
        type : String,
        required : true
    },
    subscriptionServicePlanType : {
        type : String,
        required : true,
        enum : [
            'enterpriseMax', 'enterprise', 'solopreneur', 'entrepreneur',
            'smb', 'founder', 'freelancer'
        ]
    },
    productionSiteCost : {
        type : Number,
        required : true,
        default : 20
    },
    perUserMonthPrice : {
        type : Number,
        required : true
    },
    perUserYearPrice : {
        type : Number,
        required : true
    },
    planMaximumUsers : {
        type : Number,
        required : true,
        default : 1
    },
    planMinimumUsers : {
        type : Number,
        required : true,
        default : 1
    },
    isTeamPlan : {
        type : Boolean,
        default : false
    },
    pricePerApiPing : {
        type : Number,
        required : true,
        default : 0.001
    },
    pricePerScheduledTask : {
        type : Number,
        required : true,
        default : 0.002
    },
    freeMonthlyApis : {
        type : Number,
        default : 100
    },
    freeMonthlyScheduledTasks : {
        type : Number,
        default : 50
    },
    nonProductionWebAppLimit : {
        type : Number,
        default : 4
    },
    nonProductionAPILimit : {
        type : Number,
        default : 4
    },
    hasUtilityCap : {
        type : Boolean,
        default : true
    },
    scheduledTaskUtilityCap : Number,
    apiUtilityCap : Number,
    subscriptionSplitPercentage : {
        type : Number,
        default : 20
    },
    first100Rate : {
        type : Number,
        default : 200
    },
    next900Rate : {
        type : Number,
        default : 50
    },
    post1000Rate : {
        type : String,
        default : 10
    },
    processingSubscriptionPayment : {
        type : Boolean,
        default : false
    },
    processingUtilityPayment : {
        type : Boolean,
        default : false
    },
    apiUtilizationCount : {
        type : Number,
        default : 0
    },
    pageVisitCount : {
        type : Number,
        default : 0
    },
    scheduledTaskExecutionCount : {
        type : Number,
        default : 0
    },
    productionWebApps : [{
        appId : String,
        activeAsOfTimestamp : Number
    }],
    inSubscriptionTrial : {
        type : Boolean,
        default : false
    },
    inUtilityTrial : {
        type : Boolean,
        default : false
    },
    customDomainCount : {
        type : Number,
        default : 0
    }
}, {
    strict : true,
    timestamps : true
});

inhouzSubscriptionSchema.index({
    serviceType : 1, active : 1, deactivationDate : 1,
    companyId : 1, currency : 1, signupDateTimestamp : 1, 
    cohort : 1, subscriptionDurationType: 1, utilityRenewalDate : 1,
    subscriptionServiceId : 1, subscriptionServicePlanType : 1, 
    subscriptionServiceName : 1, subscriptionServicePlanName : 1,
    processingSubscriptionPayment : 1, processingUtilityPayment : 1,
    subscriptionRenewalDate : 1, inSubscriptionTrial : 1,
    subscriptionServiceTierId : 1
});

module.exports = mongoose.model(config.inhouzSubscriptionsModel, inhouzSubscriptionSchema, config.inhouzSubscriptionsModel);