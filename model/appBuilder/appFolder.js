const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appFolderSchema = new Schema({
    folderName : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    description : String,
    restrictAccess : {
        type : Boolean,
        default : false
    },
    permittedPermissionIds : [String],
    restrictEditAccess : {
        type : Boolean,
        default : false
    },
    editPermissionIds : [String],
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
    lastUpdatedById : {
        type : String
    },
    editDate : Number
}, {
    timestamps : true,
    strict : true
});

appFolderSchema.index({
    companyId : 1, folderName : 1
})

module.exports = mongoose.model(config.appFolderModel, appFolderSchema, config.appFolderModel);