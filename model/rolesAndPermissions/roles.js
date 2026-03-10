const mongoose = require('mongoose');
const {Schema} = mongoose;
const validator = require('validator');
const config = require('../../config/config')();

const roleSchema = new Schema({
    roleName : {
        type : String,
        required : true
    },
    roleDescription : {
        type : String,
    },
    permissionIdList : [String],
    companyId : {
        type : String,
        required : true,
        index : true
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
},
{
    timestamps : true
})

module.exports = mongoose.model(config.roleModel, roleSchema, config.roleModel)