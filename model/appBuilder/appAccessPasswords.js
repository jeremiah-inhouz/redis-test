const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appAccessPasswordSchema = new Schema({
    appId : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    environment : {
        type : String,
        required : true,
        enum : ['development', 'test', 'production']
    },
    passwordHash : {
        type : String,
        required : true
    },
    resetInProgress : {
        type : Boolean,
        default : false
    },
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
    updatedById : String,
    editDate : Number
}, {
    strict : true,
    useNestedStrict : true,
    timestamps : true
});

appAccessPasswordSchema.index({
    editDate : 1, appId : 1, companyId : 1,
    environment : 1
});

module.exports = mongoose.model(config.appAccessPasswordModel, appAccessPasswordSchema, config.appAccessPasswordModel);