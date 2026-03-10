const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const subscriberSchema = new Schema({
    subscriberId : {
        type : String,
        index : true
    },
    subscriberType : {
        type : String,
        required : true,
        index : true,
        enum : ['internal', 'external']
    },
    email : {
        type : String,
        required : true,
        index : true,
        validate : {
            validator : (value) => {
                return validator.isEmail(value)
            },
            message : '{VALUE} is not a valid email'
        }
    },
    companyId : {
        type : String,
        index : true,
        required : true
    },
    firstName : {
        type : String
    },
    lastName : {
        type : String
    },
    assetOwnerCompanyId : {
        type : String,
        required : true,
        index : true
    },
    profileImageUrl : String,
    subscriptionIds : [String],
    sex : {
        type : String,
        index : true
    },
    dob : {
        type : Number
    },
    isAdmin : {
        type : Boolean,
        default : false,
        index : true
    },
    active : {
        type : Boolean,
        default : true,
        index : true
    },
    deactivationDate : Number
}, {
    timestamps : true
});

module.exports = mongoose.model(config.subscriberModel, subscriberSchema, config.subscriberModel)