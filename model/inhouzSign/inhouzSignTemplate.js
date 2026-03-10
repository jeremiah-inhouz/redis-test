const mongoose = require('mongoose');
const {Schema} = mongoose;
const validator = require('validator');
const config = require('../../config/config')();

const InhouzSignTemplateSchema = new Schema({
    documentName : {
        type : String,
        required : true
    },
    agreementState : {
        type : String,
        required : true,
        default : 'contract',
        enum : ['contract', 'proposal']
    },
    appId : {
        type : String
    },
    companyId : {
        type : String,
        required : true
    },
    isTemplate : {
        type : Boolean,
        default : true
    },
    createdById : String,
    editedById : String,
    createdByApi : {
        type : Boolean,
        default : false
    },
    createTimestamp : Number,
    updateTimestamp : Number,
    initialData : {},
    roles : [{
        sequenceNumber : {
            type : Number,
            default : 1
        },
        roleName : String,
        roleId : String,
        allowedActions : [{
            type : String,
            enum : [
                'sign', 'receiveSignedCopy', 
                'view', 'fill and sign',
                'modify and sign'
            ]
        }],
        color : String
    }],
    setSendingOrder : {
        type : Boolean,
        default : false
    },
    restrictDocumentAccess : {
        type : Boolean,
        default : false
    },
    readPermissionIds : [String],
    writePermissionIds : [String],
    documentAccessUserIds : [String],
    accessRestricted : {
        type : Boolean,
        default : false
    },
    setPasswordRestriction : {
        type : Boolean,
        default : false
    },
    passwordRestrictionType : {
        type : String,
        default : 'basicPassword',
        enum : [
            'basicPassword',
            'userAssignedPassword'
        ]
    },
    encryptedPassword : String,
    changeRequestEncryptedPassword : String,
    basicPasswordSet : {
        type : Boolean,
        default : false
    },
    setQuestionnaireRestriction : {
        type : Boolean,
        default : false
    },
    accessQuestions : [{
        question : {
            type : String,
            required : true
        },
        encryptedAnswer : String,
        answerSet : Boolean
    }],
    questionnaireIsCaseSensitive : {
        type : Boolean,
        default : false
    },
    hasExtraRestrictionPolicies : {
        type : Boolean,
        default : false
    },
    restrictionPolicies : [{
        restrictionType : {
            type : String,
            enum : [
                'minimumAge', 'blockedCountries',
                'allowedCountries', 'emailDomain',
                'emailTopLevelDomain', 'maximumAge',
                'userBlockList', 'userAllowList',
                'ipWhitelist', 'ipBlocklist'
            ]
        },
        value : {},
        createdDate : Number,
        editDate : Number
    }],
    requestDocumentIdentityVerification : {
        type : Boolean,
        default : false
    },
    documentIdentityVerificationTrustHours : {
        type : Number,
        default : 24
    },
    showTermsOfUse : {
        type : Boolean,
        default : false
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
    collectTermsOfUseAcknowledgement : Boolean,

    //payment
    collectPayment : {
        type : Boolean,
        default : false
    },
    inhouzPaymentId : String,
    payoutAccountId : String,
    paymentType : {
        type : String,
        enum : [
            'one-time', 'recurring', 
            'adjustable', 'fixed-schedule', 'fundraiser',
            'split-payment', 'flex-schedule'
        ]
    },
    dynamicPricingMode : {
        type : Boolean,
        default : false
    },
    currency : String,
    dynamicCurrency : {},
    paymentAmount : Number,
    dynamicPaymentAmount : {},
    paymentCategoryId : String,
    useInhouzProducts : {
        type : Boolean,
        default : true,
    },
    paymentMethods : [String],
    splitPaymentDetails : [{
        email : String,
        firstName : String,
        lastName : String,
        amount : Number
    }],
    fixedScheduledPaymentCount : Number,
    fixedScheduleDayInterval : Number,
    flexScheduleDetails : [{
        timestamp : Number,
        amount : Number
    }],
    collectSubscriberData : {
        type : Boolean,
        default : false
    },
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
    products : [{
        productId : {
            type : String
        },
        quantity : {
            type : Number,
            default : 1,
            min : 1
        },
        adjustableQuantity : {
            type : Boolean,
            default : false
        },
        minQuantity : {
            type : Number,
            default : 1,
            min : 1
        },
        maxQuantity : {
            type : Number,
            default : 10
        },
        canDelete : {
            type : Boolean,
            default : false
        }
    }],
    splitPaymentPaidAmount : Number,
    splitPaymentPaidBreakdown : [{
        email : String,
        role : String,
        amount : Number,
        currency : String,
        transactionId : Number,
        timestamp : Number
    }],
    collectInvoiceNumber : Boolean,
    collectPurchaseOrderNumber : Boolean,
    collectTaxNumber : Boolean,
    collectPhoneNumber : Boolean,
    collectFirstName : Boolean,
    collectLastName : Boolean,
    collectCompanyName : Boolean,
    collectBillingAddress : {
        type : Boolean,
        default : true
    },
    collectShippingAddress : Boolean,
    collectTax : Boolean,
    addressToTax : {
        type : String,
        default : 'billing',
        enum : [
            'billing', 'shipping'
        ]
    },
    invoiceNumber : {
        type : String
    },
    invoiceDueDate : {
        type : Number
    },
    paymentWebhookUrl : String,

    //approval workflow
    enableApprovalWorkflow : {
        type : Boolean,
        default : false
    },
    approvalValidations : [{
        validationId : String,
        validationType : {
            type : String,
            enum : [
                'appData', 'senderEmail', 'recipientEmail',
                'senderCountry', 'paymentAmount', 'senderPermission'
            ]
        },
        operator : {
            type : String,
            default : 'eq',
            enum : [
                'eq', 'gt', 'gte', 'in',
                'nin', 'lt', 'lte', 'neq'
            ]
        },
        currency : {
            type : String,
            default : 'USD'
        },
        dataPath : String,
        value : {},
        valueType : {
            type : String,
            enum : [
                'string', 'boolean',
                'number'
            ]
        }
    }],
    approvers : [{
        email : {
            type : String,
            lowercase : true,
            validate : {
                validator : (value) => {
                    return validator.isEmail(value)
                },
                message : '{VALUE} is not a valid email'
            }
        },
        userId : String,
        name : String,
        validationTypes : [String]
    }],
    approverPermissionIds : [String],
    requiredApprovalCount : {
        type : Number,
        default : 1
    },

    //attachments
    collectAttachments : {
        type : Boolean,
        default : false
    },
    attachmentAccept : String,
    attachmentInstructionText : String,
    requireAttachments : {
        type : Boolean,
        default : false
    },
    allowMultipleAttachments : {
        type : Boolean,
        default : false
    },

    //expiration
    hasExpiration : {
        type : Boolean,
        default : false
    },
    expirationDays : {
        type : Number,
        default : 30
    },
    expirationDateType : {
        type : String,
        default : 'projection',
        enum : [
            'projection', 'precise date'
        ]
    },
    expirationDate : String,
    expirationTimezone : String,
    expirationTimestamp : Number,

    //reminder
    sendReminder : {
        type : Boolean,
        default : false
    },
    firstReminderDays : {
        type : Number,
        default : 3
    },
    repeatReminderIntervalDays : {
        type : Number,
        default : 2
    },

    vendorMessage : String,
    developmentWebhookUrl : String,
    testWebhookUrl : String,
    productionWebhookUrl : String,

    emailSubject : String,
    emailMessage : String,

    createdByEmail : String,
    createdByFirstName : String,
    createdByLastName : String,
    createdByName : String,

    draftFileStorageServiceId : String,
    attachmentFileStorageServiceId : String,
    completedDocumentFileStorageServiceId : String
}, {
    strict : true,
    timestamps : true
});

InhouzSignTemplateSchema.index({
    documentName : 1, companyId : 1,
    collectPayment : 1, enableApprovalWorkflow : 1,
    updateTimestamp : 1, createTimestamp : 1
});

module.exports = mongoose.model(config.inhouzSignTemplateModel, InhouzSignTemplateSchema, config.inhouzSignTemplateModel);