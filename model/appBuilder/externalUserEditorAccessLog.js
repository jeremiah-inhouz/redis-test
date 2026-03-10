const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const externalUserEditorAccessLogSchema = new Schema({
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
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
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
    action : {
        type : String,
        required : true,
        enum : ['create', 'edit', 'delete']
    }
}, {
    strict : true,
    useNestedStrict : true,
    timestamps : true
})

externalUserEditorAccessLogSchema.index({
    email : 1, appId : 1, companyId : 1, 
    createDate : 1, action : 1
})

module.exports = mongoose.model(config.externalUserEditorAccessLogModel, externalUserEditorAccessLogSchema, config.externalUserEditorAccessLogModel);