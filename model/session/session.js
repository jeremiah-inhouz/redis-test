const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const sessionSchema = new Schema({
    ipAddress : {
        type : String,
        required : true,
        index : true
    },
    userId : { //one user one session only
        type : String,
        required : true,
        index : true
    },
    beginTimeStamp : {
        type : Number,
        required : true
    },
    expirationTimestamp : {
        type : Number,
        required : true
    }
},{
    timestamps : true
})

module.exports = mongoose.model(config.sessionModel, sessionSchema, config.sessionModel);