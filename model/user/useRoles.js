const mongoose = require('mongoose');
const {Schema} = mongoose;
const validator = require('validator');
const config = require('../../config/config')();

const userRolesSchema = new Schema({
    userId : {
        type : String,
        required : true,
        unique : true
    },
    companyId : {
        type : String,
        required : true,
        index : true
    },
    roleIdList : [String],
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
    }]
}, {
    timestamps : true
});

module.exports = mongoose.model(config.userRolesModel, userRolesSchema, config.userRolesModel)