const mongoose = require('mongoose');
const {Schema} = mongoose;
const validator = require('validator');
const config = require('../../config/config')();

const userSchema = new Schema({
    firstName:{
        type : String,
        required : true
    },
    lastName:{
        type : String,
        required : true
    },
    middleName : String,
    email : {
        type : String,
        required : true,
        unique : true,
        validate : {
            validator : (value) => {
                return validator.isEmail(value)
            },
            message : '{VALUE} is not a valid email'
        }
    },
    companyId:{
        type : String,
        required : true,
        index : true
    },
    subscribedWebComponents : [{
        appId : {
            type : String,
            required : true
        },
        muted : {
            type : Boolean,
            default : false
        }
    }],
    key : {
        type : String,
        unique : true,
        required : true
    },
    ownerUser : {
        type : Boolean,
        default : false
    },
    sex:String,
    maritalStatus : String,
    dob : Number, //date of birth
    phoneNumber : String,
    jobTitle : String,
    monthlyIncomeRate : Number,
    incomeType: {
        type : String,
        enum : ['salary', 'hourly', '']
    },
    employeeType : String,
    hourlyIncomeRate : Number,
    averageWeeklyHours : String,
    imageUrl : String,
    employmentStatus : String,
    employmentStartDate : Number,
    employmentEndDate : Number,
    address : {
        street : String,
        city : String,
        state : String,
        zipcode : String
    },
    passwordHash : {
        type : String,
        required : true
    },
    active : {
        type : Boolean,
        default : true,
        index : true,
        required : true
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
    }]
}, {
    timestamps : true
})

module.exports = mongoose.model(config.userModel, userSchema);