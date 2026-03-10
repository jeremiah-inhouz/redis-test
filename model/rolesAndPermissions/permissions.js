const mongoose = require('mongoose');
const {Schema} = mongoose;
const validator = require('validator');
const config = require('../../config/config')();

const permissionSchema = new Schema({
    permissionName : {
        type : String,
        required : true
    },
    permissionDescription : {
        type : String
    },
    companyId : {
        type : String,
        required : true,
        index : true
    },
    signupPermission : {
        type : Boolean,
        default : false
    },
    createdBy : {
        userId : {
            type : String,
            required : true
        },
        firstName : {
            type : String,
            required : true
        },
        middleName : String,
        fullName : String,
        lastName : {
            type : String,
            required : true
        },
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
        imageUrl : String,
        jobTitle : String,
        editDate : Date
    },
    editedBy : [{
        userId : {
            type : String,
            required : true
        },
        firstName : {
            type : String,
            required : true
        },
        middleName : String,
        fullName : String,
        lastName : {
            type : String,
            required : true
        },
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
        imageUrl : String,
        jobTitle : String,
        editDate : Date
    }],
    archived : {
        type : Boolean,
        default : false
    }
}, {
    timestamps : true
})

module.exports = mongoose.model(config.permissionModel, permissionSchema, config.permissionModel)