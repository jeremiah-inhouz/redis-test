const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const functionSchema = new Schema({
    functionConfig : {
        editableByOthers : {
            type : Boolean,
            default : true
        },
        visibleToExternalUsers : {
            type : Boolean,
            default : false
        },
        restrictAccess : {
            type : Boolean,
            default : false
        },
        readPermissionIds : [String],
        writePermissionIds : [String]
    },
    functionId : {
        type : String
    },
    functionReferences : {},
    databaseReferences : {},
    version : Number,
    companyId : {
        type : String,
        required : true
    },
    functionName : String,
    activeVersion : {
        type : Boolean,
        default : false
    },
    parameters : [{
        parameterId : String,
        parameterName : String,
        parameterType : String,
        // fromState : Boolean,
        // stateId : String,
        parameterDefaultValue : {},
        title : String
    }],
    variables : [{
        variableId : String,
        variableName : String,
        variableType : String,
        variableDefaultValue : {}
    }],
    tests : [{
        testName : String,
        testDescription : String,
        parameters : {},
        expectedOutput : {},
        createdBy : {
            userId : {
                type : String,
                required : true
            },
            firstName : {
                type : String,
                required : true
            },
            middleName : String,
            fullName : String,
            lastName : {
                type : String,
                required : true
            },
            email : {
                type : String,
                required : true,
                validate : {
                    validator : (value) => {
                        return validator.isEmail(value)
                    },
                    message : '{VALUE} is not a valid email'
                }
            },
            imageUrl : String,
            jobTitle : String,
            editDate : Date
        },
        lastThreeUpdates : [
            {
                editedBy : {
                    userId : {
                        type : String,
                        required : true
                    },
                    firstName : {
                        type : String,
                        required : true
                    },
                    middleName : String,
                    fullName : String,
                    lastName : {
                        type : String,
                        required : true
                    },
                    email : {
                        type : String,
                        required : true,
                        validate : {
                            validator : (value) => {
                                return validator.isEmail(value)
                            },
                            message : '{VALUE} is not a valid email'
                        }
                    },
                    imageUrl : String,
                    jobTitle : String,
                    editDate : Date
                },
                editDate : Number
            }
        ]
    }],
    variablesMap : {},
    groupIdList : [String],
    functionComment : String,
    externalApiCount : {
        type : Number,
        default : 0
    },
    internalApiCount : {
        type : Number,
        default : 0
    },
    functionType : String,
    hasSteps : {
        type : Boolean,
        default : false
    },
    returnType : String,
    executionObject : {},
    editedBy : [{
        userId : {
            type : String,
            required : true
        },
        firstName : {
            type : String,
            required : true
        },
        middleName : String,
        fullName : String,
        lastName : {
            type : String,
            required : true
        },
        email : {
            type : String,
            required : true,
            validate : {
                validator : (value) => {
                    return validator.isEmail(value)
                },
                message : '{VALUE} is not a valid email'
            }
        },
        imageUrl : String,
        jobTitle : String,
        editDate : Date
    }],
    createdBy : {
        userId : {
            type : String,
            required : true
        },
        firstName : {
            type : String,
            required : true
        },
        middleName : String,
        fullName : String,
        lastName : {
            type : String,
            required : true
        },
        email : {
            type : String,
            required : true,
            validate : {
                validator : (value) => {
                    return validator.isEmail(value)
                },
                message : '{VALUE} is not a valid email'
            }
        },
        imageUrl : String,
        jobTitle : String,
        editDate : Date
    },
    lastDeployedBy : {
        userId : {
            type : String,
        },
        firstName : {
            type : String,
        },
        middleName : String,
        fullName : String,
        lastName : {
            type : String,
        },
        email : {
            type : String,
            validate : {
                validator : (value) => {
                    return validator.isEmail(value)
                },
                message : '{VALUE} is not a valid email'
            }
        },
        imageUrl : String,
        jobTitle : String,
        editDate : Date
    },
    archived : {
        type : Boolean,
        default : false
    },
    functionSteps : [{
        functionName : String,
        functionComment : String,
        executionObject : {},
        functionType : String,
        hasSteps : Boolean,
        functionSteps : []
    }],
    deployed : {
        type : Boolean
    },
    lastDeployedDate : Number
}, 
{
    timestamps : true,
    strict : false
});

functionSchema.index({
    functionName : 1,
    functionComment : 1,
    companyId : 1, functionId : 1, version : 1, 
    activeVersion : 1, deployed : 1, archived : 1, 
    'functionConfig.visibleToExternalUsers' : 1,
    'functionConfig.restrictAccess' : 1
});

module.exports = mongoose.model(config.functionModel, functionSchema);