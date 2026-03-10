const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const subscriptionServiceSchema = new Schema({
    serviceName : {
        type : String,
        required : true,
        index : true
    },
    companyId : {
        type : String,
        required : true,
        index : true
    },
    serviceDescription : {
        type : String
    },
    subscriptionServiceId : {
        type : String,
        required : true,
        index : true
    },
    signupSlug : {
        type : String,
        required : true,
        lowercase : true,
        index : true
    },
    advertised : {
        type : Boolean,
        default : false,
        index : true
    },
    serviceIsActive : {
        type : Boolean,
        default : false,
        index : true
    },
    assetIds : [String],
    assetType : {
        type : String,
        required : true,
        enum : ['api', 'view']
    },
    subscriberCount : {
        type : Number,
        default : 0
    },
    serviceType : {
        type : String,
        default : 'internal',
        enum : ['internal', 'external']
    },
    allowSelfManagement : { //subscribers will have the option to create an Inhouz account
        type : Boolean,
        default : true
    },
    environment : {
        type : String,
        required : true,
        index : true,
        enum : [
            'development', 'test', 'production' //external services can only be set to production
        ]
    },
    customPaymentTiers : [{
        paymentTierType : { //freeTier, paidTier
            type : String,
            default : 'free',
            enum : ['free', 'paid']
        }, 
        paidTierType : {
            type : String,
            required : true,
            enum : [
                'recurring',
                'oneTime', 'payAsYouGo'
            ]
        },
        billingType : {
            type : String,
            default : 'perUser',
            enum : ['perUser', 'perGroup']
        },
        freePingLimit : Number,
        hasFreeTier : Boolean,
        paymentTierName : {
            type : String,
            required : true,
            default : ''
        },
        paymentTierDescription : String,
        hasPingLimit : Boolean,
        pingLimitIsDaily : Boolean,
        pingLimitCount : Number,
        rateTypeCount : Number,
        primaryCurrency : {
            type : String,
            default : 'USD'
        },
        priceIndex : [{
            currency : {
                type : String,
                required : true
            },
            priceRate : {
                type : Number,
                required : true
            }
        }],
        priceRateType : {
            type : String,
            default : 'month',
            enum : ['ping', 'week', 'month', 'year']
        },
        tierPermissionIdList : [String], //if empty anyone has access else check permissions. Automatically assign permissions to subscribers of tiers.
        hasBuiltInMigration : {
            type : Boolean,
            default : false
        },
        migrationSubscriptionId : {
            type : String,
            default : ''
        },
        migrationSubscriptionTierId : {
            type : String,
            default : ''
        },
        migrationDateUnit : {
            type : String,
            enum : ['', 'day', 'week', 'month', 'year']
        },
        migrationDateCount : {
            type : Number,
            default : 0
        },
        hasSetupFee : {
            type : Boolean,
            default : false
        },
        allowTeamSignup : {
            type : Boolean,
            default : true
        },
        setupFeePriceIndex : [{
            currency : {
                type : String,
                required : true
            },
            priceRate : {
                type : Number,
                required : true
            }
        }],
        allowPingOverages : {
            type : Boolean,
            default : false
        },
        overagePingPriceIndex : [{
            currency : {
                type : String,
                required : true
            },
            priceRate : {
                type : Number,
                required : true
            }
        }],
        hasTeamSizeLimit : {
            type : Boolean,
            default : false
        },
        teamSizeLimit : {
            type : Number,
            default : 0
        },
        allowRefunds : {
            type : Boolean,
            default : false
        },
        refundDays : {
            type : Number,
            default : 0
        }
    }],
    addOnPackages : [{
        name : {
            type : String,
            required : true
        },
        description : {
            type : String
        },
        primaryCurrency : {
            type : String,
            default : 'USD'
        },
        priceIndex : [{
            currency : {
                type : String,
                required : true
            },
            priceRate : {
                type : Number,
                required : true
            }
        }],
        setupFeePriceIndex : [{
            currency : {
                type : String,
                required : true
            },
            priceRate : {
                type : Number,
                required : true
            }
        }],
        paymentTierType : { //freeTier, paidTier
            type : String,
            default : 'free',
            enum : ['free', 'paid']
        }, 
        priceRateType : {
            type : String,
            default : 'month',
            enum : ['ping', 'week', 'month', 'year']
        }, 
        rateTypeCount : Number,
        paidTierType : {
            type : String,
            required : true,
            enum : ['recurring', 'oneTime', 'payAsYouGo']
        },
        addOnPermissionList : [String],
        hasSetupFee : {
            type : Boolean,
            default : false
        },
        billingType : {
            type : String,
            default : 'perUser',
            enum : ['perUser', 'perGroup']
        },
        allowRefunds : {
            type : Boolean,
            default : false
        },
        refundDays : {
            type : Number,
            default : 0
        }
    }],
    featureList : [{
        featureName : String,
        description : String,
        tierIdList : [String]
    }],
    signupExtraDataFields : [{
        key : {
            type : String,
            required : true
        },
        label : {
            type : String,
            required : true
        },
        dataType : {
            type : String,
            default : 'string',
            enum : [
                'string', 'number',
                'boolean',
            ]
        },
        isRequired : {
            type : Boolean,
            default : false
        },
        systemRequired : {
            type : Boolean,
            default : false
        },
        systemGenerated : {
            type : Boolean,
            default : false
        },
        display : {
            type : Boolean,
            default : false
        },
        elementType : {
            type : String,
            enum : [
                'input', 'date', 
                'switch', 'select'
            ]
        },
        options : [{
            label : String,
            value : String
        }],
        title : {
            type : String,
            default : ''
        }
    }],
    postSignupRedirectUrl : {
        type : String,
        default : ''
    },
    version : {
        type : Number,
        required : true,
        default : 1,
        index : true
    },
    readme : {
        type : String
    },
    termsOfUse : {
        type : String
    },
    useExternalTermsOfUse : {
        type : Boolean,
        default : false
    },
    termsOfUseUrl : {
        type : String,
        default : ''
    },
    signupRestrictions : [{
        restrictionType : {
            type : String,
            enum : [
                'minimumAge', 'blockedCountries',
                'allowedCountries', 'emailDomain',
                'emailTopLevelDomain', 'maximumAge'
            ]
        },
        value : {},
        createdDate : Number,
        editDate : Number,
        lastUpdatedById : String,
        createdById : String
    }],
    activeVersion : Boolean,
    deployed : Boolean,
    lastDeployedDate : Number,
    archived : {
        type : Boolean,
        index : true,
        default : false
    },
    lastDeployedById : {
        type : String
    },
    lastUpdatedById : {
        type : String
    },
    editDate : {
        type : Number
    },
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

module.exports = mongoose.model(
    config.subscriptionServiceModel, 
    subscriptionServiceSchema, 
    config.subscriptionServiceModel
)