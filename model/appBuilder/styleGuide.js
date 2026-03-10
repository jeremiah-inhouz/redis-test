const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const styleGuideSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    elementType : {
        type : String,
        required : true
    },
    savedStyleId : {
        type : String,
        required : true
    },
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
    active : {
        type : Boolean,
        default : true
    }
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

styleGuideSchema.index({
    companyId : 1, appId : 1, elementType : 1
});

module.exports = mongoose.model(config.styleGuideModel, styleGuideSchema, config.styleGuideModel);