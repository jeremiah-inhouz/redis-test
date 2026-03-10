const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const savedAppStyleSchema = new Schema({
    styleName : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    companyId : {
        type : String,
        required : true
    },
    isGlobal : {
        type : Boolean
    },
    styleArray : [{
        styleField : {
            type : String,
            required : true
        },
        set : {
            type : Boolean,
            default : false
        },
        styleValueVariations : {
            desktop : {},
            tablet : {},
            mobile : {},
            mobileLandscape : {},
        }
    }],
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
    editDate : {
        type : Number
    },
    lastUpdatedById : {
        type : String
    },
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

savedAppStyleSchema.index({
    styleName : 1, companyId : 1, appId : 1,
    isGlobal : 1
});

module.exports = mongoose.model(config.savedAppStylesModel, savedAppStyleSchema, config.savedAppStylesModel)