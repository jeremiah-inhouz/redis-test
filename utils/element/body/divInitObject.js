const divStyleInitObject = require('./divStyleInit');
const simpleScriptInitObject = require('../../script/simpleScriptInitObject');
const shortid = require('shortid');

module.exports = function(){

    return {
        elementSettings : {
            events : {},
            styleSettings : {
                baseClassName : `in${shortid.generate()}`,
                linkedClassName : ''
            },
            customAttributes : [],
            attributes : {
                title : JSON.parse(JSON.stringify(simpleScriptInitObject)),
                draggable : {
                    ...JSON.parse(JSON.stringify(simpleScriptInitObject)),
                    inputType : 'boolean',
                    inputText : false
                }
            }
        },
        styleArray : divStyleInitObject()
    }
}