const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const webComponentAccessTrackerSchema = new Schema({
    appId : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    permissionIds : [String],
    emailList : [String],
    editDate : Number,
    lastUpdatedById : String
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

module.exports = mongoose.model(config.webComponentAccessTrackerModel, webComponentAccessTrackerSchema, config.webComponentAccessTrackerModel);