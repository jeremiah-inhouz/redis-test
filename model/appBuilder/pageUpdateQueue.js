const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const pageUpdateQueueSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    pageId : {
        type : String,
        required : true
    },
    versionToUpdate : Number,
    action : {
        type : String,
        enum : ['edit', 'create', 'delete']
    },
    page : {},
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

module.exports = mongoose.model(config.pageUpdateQueueModel, pageUpdateQueueSchema, config.pageUpdateQueueModel);