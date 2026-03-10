const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const inhouzAppSchema = new Schema({
    appName : {
        type : String,
        required : true
    },
    description : {
        type : String
    },
    subdomain : {
        type : String
    },
    hostedExternally : {
        type : Boolean,
        default : false
    },
    customDomains : [
        {
            domain : String,
            active : {
                type : Boolean,
                default : false
            },
            cloudflareId : String,
            activationDate : Number
        }
    ],
    folderId : {
        type : String,
        default : ''
    },
    companyId : {
        type : String,
        required : true
    },
    thumbnail : String,
    initialState : {},
    environmentVariables : {},
    appId : {
        type : String,
        required : true
    },
    appType : {
        type : String,
        required : true,
        enum : ['webApp', 'webComponent', 'pdfFunction', 'emailFunction', 'inhouzSign', 'presentation']
    },
    parentAppId : String,
    parentAppType : String,
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
    editDate : {
        type : Number
    },
    lastUpdatedById : {
        type : String
    },
    activeVersionMap : {},
    deployedVersionMap : {},
    productionDeployedVersionMap : {},
    developmentDeployedVersionMap : {},
    testDeployedVersionMap : {},
    lastDeployDate : Number,
    deployed : {
        type : Boolean,
        default : false
    },
    pendingDeployment : {
        type : Boolean,
        default : false
    },
    settings : {
        restrictAppAccess : {
            type : Boolean,
            default : false
        },
        appRestrictionType : {
            type : String,
            default : 'subscription',
            enum : ['password', 'subscription', '']
        },
        passwordSet : {
            type : Boolean,
            default : false
        },
        passwordSetDate : {
            type : Number
        },
        passwordSetById : String,
        restrictEditorAccess : {
            type : Boolean
        },
        shareWithExternalUsers : {
            type : Boolean,
            default : false
        },
        externalUsers : [{
            _id : String,
            firstName : String,
            lastName : String,
            email : {
                type : String,
                required : true,
                validate : {
                    validator : (value) => {
                        return validator.isEmail(value)
                    },
                    message : '{VALUE} is not a valid email'
                }
            },
            readPermission : {
                type : Boolean,
                default : false
            },
            writePermission : {
                type : Boolean,
                default : false
            },
            deletePermission : {
                type : Boolean,
                default : false
            },
            createDate : {
                type : Number,
                required : true
            },
            editDate : {
                type : Number,
                required : true
            },
            createdById : {
                type : String,
                required : true
            },
            lastEditedById : {
                type : String,
                required : true
            }
        }],
        readPermissionIds : [String],
        writePermissionIds : [String],
        deletePermissionIds : [String],
        screenWidth : {
            desktop : {
                greaterThan : Number
            },
            tablet : {
                greaterThan : Number,
                lessThan : Number
            },
            mobile : {
                greaterThan : {
                    type : Number,
                    default : 0
                },
                lessThan : Number
            },
            mobileLandscape : {
                greaterThan : Number,
                lessThan : Number
            }
        },
        isLaunchApprovalRequired : {
            type : Boolean
        },
        numberOfRequiredApprovals : {
            type : Number
        },
        productionApprovalRequired : {
            type : Boolean
        },
        developmentApprovalRequired : {
            type : Boolean
        },
        testApprovalRequired : {
            type : Boolean
        },
        approvers : [{
            _id : String,
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
            createDate : {
                type : Number,
                required : true
            },
            editDate : {
                type : Number,
                required : true
            },
            createdById : {
                type : String,
                required : true
            },
            lastEditedById : {
                type : String,
                required : true
            }
        }],
        customCode : String,
        faviconString : String,
        imageFileKey : String,
        useManifestJson : {
            type : Boolean,
            default : false
        },
        manifestJson : {},
        pushSubscriptionChangeEventWebhookUrl : String,
        enableCachedAppLoading : {
            type : Boolean,
            default : false
        },
        mobileSinglePageLoading : {
            type : Boolean,
            default : false
        },
        tabletSinglePageLoading : {
            type : Boolean,
            default : false
        },
        desktopSinglePageLoading : {
            type : Boolean,
            default : false
        }
    },
    functionReferences : {},
    fontReferences : {},
    appLifeCycleFunctions : [{
        lifecycleMethod : {
            type : String,
            required : true,
            enum : [
                'onAppLoad', 'onStateUpdate', 
                'onAppDestroy', 'onRouterChange', 
                'getPrerenderData', 'onInhouzSignSubmit'
            ]
        },
        functionId : {
            type : String,
            required : true
        },
        functionParameters : {},
        description : String,
        triggerField : String,
        methodId : {
            type : String,
            required : true
        },
        pageIds : [String],
        timestamp : Number
    }],
    transactionInProgress : {
        type : Boolean,
        default : false
    },
    users : [{
        firstName : String,
        middleName : String,
        lastName : String,
        email : String,
        sex : String,
        age : Number,
        permissions : [{
            _id : String,
            permissionName : String
        }],
        isDefault : Boolean,
        subscriberId : String,
        subscriptionId : String,
        subscriptionServiceId : String,
        subscriptionServiceTierId : String,
        subscriberType : String,
        assetType : String,
        assetOwnerSubdomain : String,
        planName: String,
        serviceName : String,
        companyName : String,
        isAdmin : Boolean,
        imageUrl : String,
        companyId : String,
        assetOwnerCompanyId : String
    }],
    elementRefTracker : {},
    staticFileIdMap : {},
    rebased : {
        type : Boolean,
        default : false
    }
}, {
    strict : true,
    useNestedStrict : true,
    timestamps : true
});

inhouzAppSchema.index({
    appName : 1, description : 1, subdomain : 1,
    hostedExternally : 1,
    folderId : 1, companyId : 1, appId : 1, appType : 1,
    deployed : 1, functionReferences : 1,
    'settings.externalUsers.email' : 1, pendingDeployment : 1,
    editDate : 1, createdDate : 1, rebased : 1
});

module.exports = mongoose.model(config.inhouzAppModel, inhouzAppSchema, config.inhouzAppModel)