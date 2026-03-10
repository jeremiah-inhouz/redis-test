const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appElementUpdateQueueSchema = new Schema({
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
    elements : {},
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

module.exports = mongoose.model(config.appElementUpdateQueueModel, appElementUpdateQueueSchema, config.appElementUpdateQueueModel);