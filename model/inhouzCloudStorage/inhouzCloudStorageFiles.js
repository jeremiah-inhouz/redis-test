const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const InhouzCloudStorageFileSchema = new Schema({
    fileName : {
        type : String,
        required : true
    },
    fileSizeBytes : Number,
    fileOrigin : {
        type : String,
        enum : [
            'payment link', 
            'inhouz app',
            'subscription service',
            'on-demand',
            'inhouz sign',
            'inhouz product',
            'in-app file upload'
        ]
    },
    fileOriginId : {
        type : String
    },
    fileType : String,
    companyId : {
        type : String,
        required : true
    },
    projectId : String,
    metaTag : String, //attachment, global scope, app-to-cloud-upload, inhouz app element embedded pdf, etc
    fileKey : {
        type : String,
        required : true
    },
    bucketName : String,
    hostedExternally : {
        type : Boolean,
        default : false
    },
    fileStorageServiceId : String,
    createdTimestamp : Number,
    createdById : String,
    createdByEmail : String,
    createdByName : String
}, {
    timestamps : true,
    strict : true
});

InhouzCloudStorageFileSchema.index({
    fileName : 1, fileOrigin : 1, fileOriginId : 1,
    fileType : 1, fileStorageServiceId : 1, bucketName : 1,
    hostedExternally : 1, createdTimestamp : 1, 
    createdByName : 1, createdByEmail : 1,
    metaTag : 1, projectId : 1
});

module.exports = mongoose.model(
    config.inhouzCloudStorageFileModel, 
    InhouzCloudStorageFileSchema,
    config.inhouzCloudStorageFileModel
);