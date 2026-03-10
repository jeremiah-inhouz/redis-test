const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appPageSchema = new Schema({
    appId : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    appType : {
        type : String,
        required : true,
        enum : [
            'webApp', 'webComponent', 'pdfFunction', 'emailFunction',
            'inhouzSign', 'presentation'
        ]
    },
    pageId : {
        type : String,
        required : true
    },
    pageName : {
        type : String,
        required : true
    },
    variationId : {
        type : String,
        default : 'original'
    },
    is404Page : {
        type : Boolean,
        default : false
    },
    isRootPage : {
        type : Boolean,
        default : false
    },
    description : String,
    slug : {
        type : String
    },
    metaNoIndex : {
        type : Boolean,
        default : false
    },
    metaNoFollow : {
        type : Boolean,
        default : false
    },
    metaNoImageIndex : {
        type : Boolean,
        default : false
    },
    metaNoSnippet : {
        type : Boolean,
        default : false
    },
    metaNoArchive : {
        type : Boolean,
        default : false
    },
    dynamicSEO : {
        type : Boolean,
        default : false
    },
    staticSEO : {
        metaTitle : String,
        metaDescription : String,
    },
    staticOpenGraph : {
        metaOgTitle : String,
        metaOgDescritpion : String,
        metaOgImageUrl : String,
        metaKeywords : String,
        metaOgUrl : String,
        metaOgSiteName : String
    },
    dynamicSEOTags : {
        metaTitle : {},
        metaDescription : {},
    },
    dynamicOpenGraph : {
        metaOgTitle : {},
        metaOgDescritpion : {},
        metaOgImageUrl : {},
        metaKeywords : {},
        metaOgUrl : {},
        metaOgSiteName : {}
    },
    customCode : String,
    presentationText : String,
    routeParameters : [{
        routeParameterName : String,
        description : String
    }],
    routeQueryStrings : [{
        queryStringName : String,
        description : String
    }],
    restrictPageAccess : {
        type : Boolean,
        default : false
    },
    pdfWidth : {
        type : Number,
        default : 816
    },
    pdfHeight : {
        type : Number,
        default : 1056
    }, 
    pdfAspectRatioWidth : {
        type : Number,
        default : 8.5
    },
    pdfAspectRatioHeight : {
        type : Number,
        default : 11
    },
    presentationRatioWidth : {
        type : Number,
        default : 16
    },
    presentationRatioHeight : {
        type : Number,
        default : 9
    },
    presentationNote : String,
    pageNumber : Number,
    pageLifeCycleFunctions : [{
        lifecycleMethod : {
            type : String,
            required : true,
            enum : ['onPageLoad', 'onPageDestroy']
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
        timestamp : Number
    }],
    lastUpdatedById : String,
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
    editDate : Number,
    versionTracker : [{
        version : {
            type : Number,
            required : true
        }
    }],
}, {
    strict : true,
    useNestedStrict : true,
    timestamps : true
});

appPageSchema.index({
    appId : 1, companyId : 1, pageId : 1, appType : 1,
    pageName : 1, variationId : 1, is404Page : 1, slug : 1,
    isRootPage : 1, 'versionTracker.page' : 1
});

module.exports = mongoose.model(config.appPageModel, appPageSchema, config.appPageModel)