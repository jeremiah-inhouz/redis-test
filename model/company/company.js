const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const companySchema = new Schema({
    companyName : {
        type : String,
        required : true
    },
    companyType : {
        type : String,
        required : true,
        default : 'solopreneur',
        enum : [
            'enterpriseMax', 'enterprise', 'solopreneur', 'entrepreneur',
            'thirdParty', 'smb', 'founder', 'freelancer'
        ]
    },
    subDomain : { //free company get 'www'
        type : String,
        lowercase : true
    },
    industry : {
        type : String
    },
    logoUrl : String,
    addresses : [{
        locationName : String,
        phoneNumber : String,
        street : String,
        city : String,
        state : String,
        country : String,
        zipcode : String
    }],
    defaultFileStorageServiceId : String,
    defaultVideoStorageServiceId : String,
    defaultDatabaseId : String,
    defaultInhouzSignDraftFileStorageServiceId : String,
    defaultInhouzSignCompletedFileStorageServiceId : String,
    defaultInhouzSignAttachmentFileStorageServiceId : String,
    defaultPdfGeneratorFileStorageServiceId : String,
    defaultInhouzPaymentFileStorageServiceId : String,
    defaultInhouzProductFileStorageServiceId : String,
    privateAssetMinimumOwners : {
        type : Number,
        default : 2
    },
    defaultPaymentMethodId : String,
    updatedDate : Number,
    updatedById : String,
    stripeCustomerId : {
        type : String,
        default : ''
    },
    addedToStripe : Boolean,
    status : {
        type : String,
        default : 'active',
        enum : ['active', 'cancelled', 'paused']
    },
    nonActiveReason : [{
        reason : String,
        timestamp : Number
    }],
    subscriptionServiceRenewalFailCount : {
        type : Number,
        default : 0
    },
    inhouzAccountRenewalFailCount : {
        type : Number,
        default : 0
    },
    inhouzUtilityRenewalFailCount : {
        type : Number,
        default : 0
    },
    promoCode : {
        type : String,
        default : ''
    },
    signupTimestamp : {
        type : Number
    },
    companyLogoId : {
        type : String
    },
    signupCountryCode : String,
    subscribedAssetIds : [String],
    assetOwnerCompanyId : String,
    environment : String,
    onDemandPaymentEnabled : {
        type : Boolean,
        default : false
    }
}, {
    strict : true,
    timestamps : true
});

companySchema.index({
    companyName : 1, companyType : 1,
    subDomain : 1, industry : 1,
    status : 1, subscribedAssetIds : 1,
    assetOwnerCompanyId : 1, environment : 1
})

module.exports = mongoose.model(config.companyModel, companySchema);