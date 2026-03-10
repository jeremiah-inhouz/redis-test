const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const savedAppElementSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    name : {
        type : String,
        required : true
    },
    appId : String,
    isGlobal : {
        type : Boolean,
        default : false
    },
    elementType : {
        type : String,
        required : true
    },
    cloneType : {
        type : String,
        required : true,
        enum : ['reference', 'deepCopy']
    },
    referenceElementId : String,
    compressedDeepCopy : String,
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
}, {
    timestamps : true,
    strict : true,
});

savedAppElementSchema.index({
    companyId : 1, isGlobal : 1,
    appId : 1, elementType : 1,
    name : 1
});

module.exports = mongoose.model(config.savedAppElementModel, savedAppElementSchema, config.savedAppElementModel);