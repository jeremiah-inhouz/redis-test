const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const functionVersionTrackerSchema = new Schema({
    functionId : {
        type : String,
        required : true,
        index : true
    },
    companyId : {
        type : String,
        required : true,
        index : true
    },
    activeVersion : {
        type : Number,
        default : 1
    },
    deployedVersion : {
        type : Number,
        default : 1
    },
    deployDate : Number,
    versions : [{
        versionNumber : Number,
        createDate : Number,
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
        }
    }]
})

module.exports = mongoose.model(config.functionVersionTrackerModel, functionVersionTrackerSchema);