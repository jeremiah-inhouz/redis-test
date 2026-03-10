const config = require("../../../config/config")();
const mongoose = require('mongoose');
const AppElementCollection = mongoose.model(config.appElementModel);

recursiveGetMissingEmbeddedElements = async (elementIdList, elementMap={}, query={}) => {
    let accumulator = [];
    try{
        if(Array.isArray(elementIdList)){
            for (let i = 0; i < elementIdList.length; i++){
                let elementId = elementIdList[i];
                if(!elementMap[elementId]){
                    let elementList = await recursiveGetMissingEmbeddedElements(
                        elementId,
                        elementMap,
                        query
                    );

                    for(let k = 0; k < elementList.length; k++){
                        let element = elementList[k];
                        elementMap[element['elementId']] = true;
                        accumulator.push(element);
                    }
                }
            }
        }else{
            let element = await AppElementCollection.findOne(
                {
                    ...query,
                    elementId : elementIdList
                }, 
                {
                    versionTracker : 0,
                    abTestId : 0, 
                    variationId : 0,
                    deployed : 0,
                    lastUpdatedById : 0,
                    createdDate : 0,
                    createdById : 0,
                    createdAt : 0,
                    updatedAt : 0,
                    __v : 0
                }
            )
            .lean()
            .catch(e => {
                console.log('/recursiveGetMissingEmbeddedElements getElement mongo error', e)
                return {error : true}
            });

            if(element && element['_id']){
                accumulator.push(element);
                elementMap[element['elementId']] = true;
                let {nestedElementIds=[]} = element;
                let missingElementIds = [];
                for (let i = 0; i < nestedElementIds.length; i++){
                    let elementId = nestedElementIds[i];
                    if(!elementMap[elementId]){
                        missingElementIds.push(elementId);
                    }
                }
                if(missingElementIds.length > 0){
                    let elementList = await recursiveGetMissingEmbeddedElements(
                        missingElementIds,
                        elementMap,
                        query
                    );
                    accumulator.push(...elementList);
                }
            }
        }

        return accumulator;
    }catch(e){
        console.log('recursiveGetMissingEmbeddedElements catch block error', e);
        return accumulator;
    }
}

module.exports = recursiveGetMissingEmbeddedElements;