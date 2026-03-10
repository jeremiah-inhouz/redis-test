const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const staticBase64FileSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    base64 : String
}, {
    timestamps : true,
    strict : true
});

staticBase64FileSchema.index({
    companyId : 1
});

module.exports = mongoose.model(config.staticBase64FileModel, staticBase64FileSchema, config.staticBase64FileModel)