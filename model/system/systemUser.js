const mongoose = require('mongoose');
const {Schema} = mongoose;
const validator = require('validator');
const config = require('../../config/config')();

const systemUserSchema = new Schema({
    companyId : {
        type : String,
        required : true,
        index : true
    },
    userName : {
        type : String,
        required : true,
        index : true
    },
    email : {
        type : String,
        validate : {
            validator : (value) => {
                if(
                    value && 
                    typeof value === 'string'
                ){
                    return validator.isEmail(value)
                }else{
                    return true;
                }
            },
            message : '{VALUE} is not a valid email'
        },
        index : true
    },
    flexApiIds : [String],
    permissionIds : [String],
    lastUpdatedById : {
        type : String
    },
    productionEncryptedApiKey : {
        type : String
    },
    testEncryptedApiKey : {
        type : String
    },
    developmentEncryptedApiKey : {
        type : String
    },
    editDate : {
        type : Number
    },
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

module.exports = mongoose.model(config.systemUserModel, systemUserSchema, config.systemUserModel)