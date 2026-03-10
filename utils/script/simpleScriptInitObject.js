module.exports = {
    isInput : true, //if true, show input, else show selectOption ui
    inputType : 'text', //text, number, boolean, object, array, function. Text has the option of being a variable holder
    unitType : 'expression', //expression, operator, bracket
    isVariable : false, 
    variableType : '', //variable, state, parameter
    mappingFunctions : [], //if variable and has mapping functions map to destination
    inputText : '', //add, subtract, divide, multiply, openBracket, closeBracket, and, or, expressionValue
    secondaryFunctions : [], //power
    expressionMethods : [],
    variableTypeof : '', //the type if any of the referenced variable
    functionParameters : {},
    externalFunctionId : '',
    companyId : '',
    varId : '' //this is the id of the variable or parameter for proper referencing.
}