const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const abTestsSchema = new Schema({
    abTestName : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    versionTracker : [Number],
    description : String,
    hasTestingLimit : {
        type : Boolean,
        default : false
    },
    testLimitType : {
        type : String,
        enum : ['appVisits', 'uniqueUsers', 'uniqueVisits', 'date']
    },
    testLimitCount : Number,
    testLimitDate : Number,
    autoSelectWinningTest : {
        type : Boolean,
        default : false
    },
    active : {
        type : Boolean,
        default : true
    },
    variations : [{ 
        variationName : {
            type : String,
            required : true
        },
        isOriginal : {
            type : Boolean,
            default : false
        },
        trafficPercentage : {
            type : Number
        },
        goals : [{
            goalName : String,
            elementId : {
                type : String
            },
            event : {
                type : String,
                enum : ['click', 'doubleClick', 'scrollY', 'elementMount', 'scrollX', 'sessionLength', 'hover']
            },
            eventTargetAmount : Number
        }]
    }],
    manageSegments : {
        type : Boolean,
        default : false
    },
    segments : [{
        segmentName : String,
        description : String,
        segmentType : {
            type : String,
            enum : ['country', 'operatingSystem', 'newVsOldUsers', 'deviceType', 'sessionLength']
        },
        segmentData : [String]
    }],
    createdById : {
        type : String,
        required : true
    },
    createdDate : {
        type : Number
    },
    updatedById : String,
    editDate : Number
}, {
    strict : true,
    useNestedStrict : true,
    timestamps : true
});

abTestsSchema.index({
    abTestName : 1, appId : 1, companyId : 1, active : 1
})

module.exports = mongoose.model(config.abTestsModel, abTestsSchema, config.abTestsModel);