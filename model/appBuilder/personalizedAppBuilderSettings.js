const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const personalizedAppBuilderSettingsSchema = new Schema({
    userId : {
        type : String,
        index : true,
        required : true
    },
    companyId : {
        type : String,
        index : true,
        required : true
    },
    appId : {
        type : String,
        required : true,
        index : true
    },
    appBuilderTheme : {
        type : String,
        enum : ['dark', 'light'],
        default : 'dark'
    },
    multiplayerModePreference : {
        type : String,
        enum : ['fullSync', 'partialSync'],
        default : 'partialSync'
    },
    currentAppBuilderState : {} //keep track of page in focus, scroll position, etc
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

module.exports = mongoose.model(config.personalizedAppBuilderSettingsModel, personalizedAppBuilderSettingsSchema, config.personalizedAppBuilderSettingsModel)