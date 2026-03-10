const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const fileStorageServiceSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    storageLocation : {
        type : String,
        required : true,
        enum : ['AWS S3', 'Azure Blob Storage', 'Google Cloud Storage', 'Vimeo']
    },
    videoFiles : {
        type : Boolean,
        default : false
    },
    databaseId : String,
    collectionName : String,
    storageServiceName : {
        type : String,
        required : true
    },
    description : String,
    addExtraRestriction : {
        type : Boolean,
        default : false
    },
    restrictionType : {
        type : String
    },
    permissionIdList : [String],
    userIdList : [String],
    s3AccessKeyId : String,
    s3SecretAccessKey : String,
    awsBucketName : String,
    awsRegion : String,
    azureContainerName : String,
    azureBlobSasUrl : String,
    azureStorageAccountKey : String,
    googleProjectId : String,
    googlePrivateKeyId: String,
    googlePrivateKey : String,
    googleClientEmail : String,
    googleClientId : String,
    googleClientX509CertUrl : String,
    googleBucketName : String,
    vimeoClientId : String,
    vimeoClientSecret : String,
    vimeoAccessToken : String,
    createdById : {
        type : String,
        required : true
    },
    updatedById : {
        type : String,
        required : true
    },
    createdDate : {
        type : Number,
        required : true
    },
    updatedDate : {
        type : Number,
        required : true
    }
}, {
    strict : true
});

fileStorageServiceSchema.index({
    companyId : 1, storageLocation : 1,
    description : 1, storageServiceName : 1,
    createdById : 1, updatedById  : 1,
    createdDate : 1, updatedDate : 1
});

module.exports = mongoose.model(config.fileStorageServiceModel, fileStorageServiceSchema, config.fileStorageServiceModel);