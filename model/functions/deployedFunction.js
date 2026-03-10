const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();
const validator = require('validator');

const deployedFunctionSchema = new Schema({
    functionId : {
        type : String
    },
    functionReferences : {},
    functionIdReferences : {},
    version : Number,
    companyId : {
        type : String,
        required : true
    },
    functionName : String,
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
    variablesMap : {},
    groupIdList : [String],
    functionType : String,
    hasSteps : {
        type : Boolean,
        default : false
    },
    returnType : String,
    executionObject : {},
    functionSteps : [{
        functionName : String,
        functionComment : String,
        executionObject : {},
        functionType : String,
        hasSteps : Boolean,
        functionSteps : []
    }],
    environment : {
        type : String,
        enum : ['development', 'test', 'production']
    },
    deploymentDate : {
        type : Number,
        required : true
    },
    deployedBy : {
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
    }
}, 
{
    timestamps : true,
    strict : false
});

deployedFunctionSchema.index({
    environment : 1,
    companyId : 1, functionId : 1,
    functionName : 1
});

module.exports = mongoose.model(config.deployedFunctionModel, deployedFunctionSchema);