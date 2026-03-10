const mongoose = require('mongoose');
const config = require('../../config/config')();
const {uniq, compact} = require('lodash')
const DeployedFunctionCollection = mongoose.model(config.deployedFunctionModel);

recursiveFunctionQuery = async (functionIdList=[], companyId='', existingFunctionIdList=[], environment='') => {
    let accumulator = {}, refList = [...existingFunctionIdList];
    try{
        if(Array.isArray(functionIdList)){
            for (let i = 0; i < functionIdList.length; i++){
                let functionId = functionIdList[i];
                let response = await recursiveFunctionQuery(functionId, companyId, refList, environment);
                accumulator = {
                    ...accumulator,
                    ...response['accumulator']
                }
                refList = uniq(compact([...refList, ...response['refList']]));
            }
        }else{
            if(mongoose.Types.ObjectId.isValid(functionIdList)){
                let functionObj = await DeployedFunctionCollection.findOne(
                    {
                        companyId,
                        functionId : functionIdList,
                        environment
                    },
                    {
                        lastDeployedBy : 0,
                        createdBy : 0,
                        editedBy : 0,
                        lastThreeUpdates : 0,
                        tests : 0,
                        functionConfig : 0,
                        groupIdList : 0,
                        externalApiCount : 0,
                        internalApiCount : 0,
                        archived : 0,
                        title : 0,
                        createdAt : 0,
                        updatedAt : 0,
                        __v : 0,
                        activeVersion : 0,
                        functionComment : 0,
                        deploymentDate : 0,
                        deployedBy : 0,
                        environment : 0
                    }
                )
                .lean()
                .catch(e => {
                    console.log('/recursiveFunctionQuery getFunction mongo error', e);
                    return null
                });
    
                if(functionObj){
                    accumulator[functionObj['functionId']] = functionObj;
                    refList.push(functionObj['functionId']);
                    if(
                        functionObj['functionReferences'] && 
                        Object.keys(functionObj['functionReferences']).length > 0
                    ){
                        let newList = [];
                        for(let t in functionObj['functionReferences']){
                            let count = functionObj['functionReferences'][t];
                            if(count > 0 && !refList.includes(t)){
                                newList.push(t);
                                refList.push(t);
                            }
                        }

                        if(newList.length > 0){
                            let response = await recursiveFunctionQuery(newList, companyId, refList, environment);
                            accumulator = {
                                ...accumulator,
                                ...response['accumulator']
                            }
                            refList = uniq(compact([...refList, ...response['refList']]));
                        }
                    }
                }
            }
        }
        return {accumulator, refList};
    }catch(e){
        console.log('/recursiveFunctionQuery catch block error', e);
        return {accumulator, refList};
    }
}

module.exports = {
    recursiveFunctionQuery
}