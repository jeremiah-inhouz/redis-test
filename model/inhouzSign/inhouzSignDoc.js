const mongoose = require('mongoose');
const {Schema} = mongoose;
const validator = require('validator');
const config = require('../../config/config')();

const InhouzSignDocSchema = new Schema({
    documentName : {
        type : String,
        required : true
    },
    // agreementState : {
    //     type : String,
    //     required : true,
    //     default : 'contract',
    //     enum : ['contract', 'proposal']
    // },
    environment : {
        type : String,
        required : true,
        lowercase : true,
        enum : [
            'development', 'test',
            'production'
        ]
    },
    useTemplate : {
        type : Boolean,
        default : false
    },
    templateId : {
        type : String
    },
    projectId : {
        type : String
    },
    appId : {
        type : String
    },
    companyId : {
        type : String,
        required : true
    },
    version : Number,
    versionTracker : [{
        version : Number,
        timestamp : Number
    }],
    status : {
        type : String,
        required : true,
        enum : [
            'draft', 'sent', 
            'partially signed', 'signed',
            'complete', 'partially agreed', 'agreed',
            'cancelled', 'awaiting approval',
            'document scheduled', 'approved',
            'expired', 'payment pending', 'declined'
        ]
    },
    functionGenerated : {
        type : Boolean,
        default : false
    },
    documentGenerated : {
        type : Boolean,
        default : false
    },
    documentGenerationEncryptedKey : String,
    documentStaticFileId : String,
    documentStaticFileSize : Number,
    proposalAgreementTimestamp : Number,
    completeTimestamp : Number,
    proposalSendTimestamp : Number,
    contractSendTimestamp : Number,
    cancellationTimestamp : Number,
    expirationTimestamp : Number,
    declineTimestamp : Number,
    createdById : String,
    editedById : String,
    createdByApi : {
        type : Boolean,
        default : false
    },
    createTimestamp : Number,
    updateTimestamp : Number,
    documentData : {},
    recipients : [{
        firstName : String,
        lastName : String,
        recipientName : String,
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
        color : String,
        organizationName : String,
        organizationId : String,
        jobTitle : String,
        phoneNumber : String,
        address : {
            line1 : String,
            line2 : String,
            city : String,
            state : String,
            country : String,
            postalCode : String
        },
        sequenceNumber : {
            type : Number,
            default : 1
        },
        roleId : String,
        roleName : String,
        signature : {},
        initials : {},
        allowedActions : [{
            type : String,
            enum : [
                'sign', 'receiveSignedCopy', 
                'view', 'fill and sign',
                'modify and sign'
            ]
        }],
        recipientId : String,
        sendCustomMessage : Boolean,
        emailSubject : String,
        emailMessage : String,
        signed : Boolean,
        signTimestamp : Number,
        paid : Boolean,
        paidTimestamp : Number,
        currency : String,
        paymentAmount : Number,
        inhouzPaymentIds : [String],
        attachmentUploaded : Boolean,
        esignatureConsentAccepted : {
            type : Boolean,
            default : false
        },
        esignatureConsentTimestamp : {
            type : Number
        },
        viewed : Boolean,
        sent : Boolean,
        sessionCount : Number,
        sessionDuration : Number,
        sendTimestamp : Number,
        declined : Boolean,
        declineTimestamp : Number
    }],
    sentEmails : [String],
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
        default : 'userAssignedPassword',
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

    //payment
    collectPayment : {
        type : Boolean,
        default : false
    },
    inhouzPaymentId : String,
    paymentLinkId : String,
    paymentLinkSlug : String,
    currency : {
        type : String,
        default : 'USD'
    },
    paymentAmount : {
        type : Number,
        default : 0
    },
    monetaryValue : {
        type : Number,
        default : 0
    },
    paidAmount : {
        type : Number,
        default : 0
    },
    useTemplatePaymentConfigurations : Boolean,

    // PAYMENT DETAILS STARTS HERE
    paymentDetails : {
        paymentDetailsInitialized : Boolean,
        themeId : String,
        payoutAccountId : {
            type : String
        },
        name : {
            type : String
        },
        description : String,
        slug : {
            type : String,
            lowercase : true
        },
        projectId : {
            type : String
        },
        metadata : {},
        defaultCurrency : {
            type : String,
            default : 'USD'
        },
        //pricing rule
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
        isSingleUse : {
            type : Boolean,
            default : false
        },
        webhookUrl : String,
        devWebhookUrl : String,
        testWebhookUrl : String,
        productionWebhookUrl : String,
        emailMessage : String,
        collectInvoiceNumber : Boolean,
        collectPurchaseOrderNumber : Boolean,
        collectTaxNumber : Boolean,
        collectPhoneNumber : Boolean,
        collectFirstName : Boolean,
        collectLastName : Boolean,
        collectCompanyName : Boolean,
        additionalAmount : Number,
        additionalAmountLabel : String,
        autoPay : { //only on recurring type transactions
            type : Boolean,
            default : true
        },
        paymentLinkType : {
            type : String,
            default : 'one-time',
            enum : [
                'one-time', 'recurring', 
                'adjustable', 'fixed-schedule', 'fundraiser',
                'split-payment', 'flex-schedule'
            ]
        },
        paymentAmount : Number,
        applySimpleInterest : {
            type : Boolean
        },
        simpleInterestPercentage : {
            type : Number
        },
        simpleInterestDurationType : {
            type : String,
            default : 'year',
            enum : [
                'month', 'year'
            ]
        },
        simpleInterestDurationCount : {
            type : Number
        },
        delayInitialPayment : {
            type : Boolean
        },
        initialPaymentDelayDayCount : Number,
        paymentCategoryId : String,
        nonProductMedia : [{
            mediaType : {
                type : String,
                default : 'image',
                enum : ['image', 'video']
            },
            inhouzStaticFileId : String,
            url : String,
            altText : String,
            hostedExternally : Boolean,
            fileName : String,
            fileSize : Number
        }],
        hasExpiration : {
            type : Boolean,
            default : false
        },
        expirationTimestamp : Number,
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
        attachContracts : {
            type : Boolean,
            default : false
        },
        contracts : [{
            isExternalDoc : Boolean,
            documentRef : String,
            name : String,
            description : String,
            isRequired : Boolean
        }],
        useInhouzProducts : {
            type : Boolean
        },
        products : [{
            productId : {
                type : String
            },
            name : String,
            categoryName : String,
            unitPrice : Number,
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
        displayFormat : {
            type : String,
            enum : [
                'regular', 'invoice'
            ]
        },
        paymentElementTheme : {
            type : String,
            default : 'stripe'
        },
        styleConfiguration : {},
        displayBanner : {
            type : Boolean,
            default : false
        },
        bannerIsExternalDoc : Boolean,
        bannerImageRef : String,
        customerLogo : String,
        routeParameters : [{
            routeParameterName : String,
            description : String
        }],
        allowDiscountCode : {
            type : Boolean,
            default : false
        },
        paymentMethods : [String],
        splitPaymentDetails : [{
            email : String,
            firstName : String,
            lastName : String,
            amount : Number,
            roleName : String,
            roleId : String
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
        isUsed : {
            type : Boolean,
            default : false
        },
        splitPaymentPaidAmount : Number,
        splitPaymentPaidBreakdown : [{
            email : String,
            amount : Number,
            currency : String,
            transactionId : Number,
            timestamp : Number
        }],
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
        collectTermsOfUseAcknowledgement : Boolean
    },

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
        valueType : String
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
        name : String,
        userId : String,
        validationTypes : [String],
        enableSubValidation : {
            type : Boolean
        },
        subValidations : [{
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
                    'nin', 'lt', 'lte', 'neq',
                    'withinRange'
                ]
            },
            currency : {
                type : String,
                default : 'USD'
            },
            dataPath : String,
            value : {},
            minRangeValue : Number,
            maxRangeValue : Number,
            valueType : String
        }]
    }],
    approverPermissionIds : [String],
    requiredApprovalCount : {
        type : Number,
        default : 1
    },
    documentApproved : {
        type : Boolean,
        default : false
    },
    approvalGroupId : String,

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
    attachmentSize : Number,
    attachmentCount : Number,

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
    expirationDateSet : {
        type : Boolean,
        default : false
    },
    documentExpired : {
        type : Boolean,
        default : false
    },

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

    //send schedule
    hasSendSchedule : {
        type : Boolean,
        default : false
    },
    sendScheduleProcessed : {
        type : Boolean,
        default : false
    },
    sendScheduleTime : String,
    sendScheduleTimezone : Number,
    sendTimestamp : Number,

    vendorMessage : String,
    webhookUrl : String,

    emailSubject : String,
    emailMessage : String,

    createdByEmail : {
        type : String,
        required : true
    },
    createdByFirstName : String,
    createdByLastName : String,
    createdByName : String,
    createdBySystemUser : {
        type : Boolean,
        default : false
    },
    createdByCompanyId : String,
    createdBySubscriber : Boolean,
    createdBySubscriptionId : String,
    createdBySubscriptionServiceId : String,
    createdByInternalUser : Boolean,


    currentSendSequence : {
        type : Number,
        default : -1
    },

    approvalRequestMetricCollected : Boolean,
    sendMetricsCollected : Boolean,
    viewMetricsCollected : Boolean,

    draftFileStorageServiceId : String,
    attachmentFileStorageServiceId : String,
    completedDocumentFileStorageServiceId : String
}, {
    strict : true,
    timestamps : true
});

InhouzSignDocSchema.index({
    documentName : 1, companyId : 1, environment : 1,
    status : 1, proposalAgreementTimestamp : 1, 
    completeTimestamp : 1, proposalSendTimestamp : 1,
    contractSendTimestamp : 1, 'recipients.email' : 1,
    collectPayment : 1, enableApprovalWorkflow : 1, 
    updateTimestamp : 1, createTimestamp : 1,
    sendScheduleProcessed : 1, hasSendSchedule : 1,
    projectId : 1, sendTimestamp : 1, documentExpired : 1,
    documentGenerated : 1, expirationTimestamp : 1,
    cancellationTimestamp : 1, declineTimestamp : 1,
    functionGenerated : 1
});

module.exports = mongoose.model(config.inhouzSignDocModel, InhouzSignDocSchema, config.inhouzSignDocModel);