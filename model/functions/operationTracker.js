const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const operationTrackerSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    operationId : {
        type : String,
        required : true
    },
    operationIdField : {
        type : String,
        required : true
    },
    operationType : {
        type : String,
        required : true
    }
},
{
    timestamps : true,
    strict : true
});

module.exports = mongoose.model(config.operationTrackerModel, operationTrackerSchema);