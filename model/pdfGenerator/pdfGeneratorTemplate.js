const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const pdfGeneratorTemplateSchema = new Schema({
    documentName : {
        type : String,
        required : true
    },
    appId : {
        type : String
    },
    companyId : {
        type : String,
        required : true
    },
    createdById : String,
    editedById : String,
    createTimestamp : Number,
    updateTimestamp : Number,
    initialData : {},
    draftFileStorageServiceId : String,
    createdByEmail : String,
    createdByFirstName : String,
    createdByLastName : String,
    createdByName : String,
}, {
    strict : true,
    timestamps : true
});

pdfGeneratorTemplateSchema.index({
    documentName : 1, appId : 1, companyId : 1,
    updateTimestamp : 1, createTimestamp : 1,
    createdByEmail : 1, createdByName : 1
});

module.exports = mongoose.model(
    config.pdfGeneratorTemplateModel, 
    pdfGeneratorTemplateSchema, 
    config.pdfGeneratorTemplateModel
);