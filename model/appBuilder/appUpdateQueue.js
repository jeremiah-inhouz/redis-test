const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appUpdateQueueSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    versionToUpdate : Number,
    deletedElementIds : [String],
    variationId : {
        type : String
    },
    appObject : {},
    elements : {},
    pages : {},
    deletedPageIds : [String],
    timestamp : {
        type : Number,
        required : true
    },
    processed : {
        type : Boolean,
        default : false
    },
    createdById : {
        type : String,
        required : true
    }
}, {
    timestamps : true,
    strict : true
});

module.exports = mongoose.model(config.appUpdateQueueModel, appUpdateQueueSchema, config.appUpdateQueueModel);