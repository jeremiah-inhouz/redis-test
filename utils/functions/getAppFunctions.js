const mongoose = require('mongoose');
const config = require('../../config/config')();
const {uniq, compact} = require('lodash');
const {recursiveFunctionQuery} = require('./recursiveFunctionQuery');

module.exports = async (app={}, environment='') => {
    try{
        const {functionReferences={}, companyId=''} = app;

        if(
            !companyId ||
            typeof companyId !== 'string'
        ){
            return {
                error : {
                    message : 'Required fields are missing.'
                }
            }
        }

        let functionIds = [];
        for (let k in functionReferences){
            let count = JSON.parse(JSON.stringify(functionReferences[k]));
            if(count > 0){
                functionIds.push(k);
            }
        }

        let map = await recursiveFunctionQuery(
            uniq(compact(functionIds)),
            companyId,
            [],
            environment
        );

        return map['accumulator'];
    }catch(e){
        return {
            error : {
                message : 'Failed to get app functions'
            }
        }
    }
}