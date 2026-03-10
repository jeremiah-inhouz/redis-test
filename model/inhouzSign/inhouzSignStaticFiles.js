const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const inhouzSignStaticFilesSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    base64 : String,
    appId : String
}, {
    timestamps : true,
    strict : true
});

inhouzSignStaticFilesSchema.index({
    companyId : 1, appId : 1
});

module.exports = mongoose.model(config.inhouzSignStaticFileModel, inhouzSignStaticFilesSchema, config.inhouzSignStaticFileModel)