const getRecursiveElementIds = require('./recursiveElementTreeId');
const mongoose = require('mongoose');
const shortid = require('shortid');

module.exports = (params={}) => {
    try{
        const {
            elementId='', appElementsMap={},
            appId='', req, elementRefTracker={},
            pageId='', timestamp=0, clonedIdMap={},
            newPageIdMap={}
        } = params;
        let exists = appElementsMap[elementId];
        if(!exists){
            return {
                error : true
            }
        }

        let refTrackMap = JSON.parse(JSON.stringify(elementRefTracker));
        //get entire element root tree
        let elementTreeIdList = getRecursiveElementIds(elementId, appElementsMap);

        //clone every element discovered in root
        let cloneIdMap=JSON.parse(JSON.stringify(clonedIdMap)), 
        clonedList=[], finalList=[];
        for (let i = 0; i < elementTreeIdList.length; i++){
            let id = elementTreeIdList[i];
            let elementExists = appElementsMap[id];
            if(elementExists && !cloneIdMap[id]){
                let element = JSON.parse(JSON.stringify(elementExists));
                let {
                    elementType='', base64='', staticFileId='', staticFileUrl=''
                } = element;
                if(!refTrackMap[elementType]){
                    refTrackMap[elementType] = 0;
                }
                let newId = new mongoose.Types.ObjectId().toHexString();
                cloneIdMap[element['elementId']] = newId;
                let newObj = {
                    ...element,
                    companyId : req.user['companyId'],
                    appId,
                    elementId : newId,
                    pageId,
                    versionTracker : [{version : 0}],
                    deployed : false,
                    lastUpdatedById : req.user['_id'].toString(),
                    createdById : req.user['_id'].toString(),
                    createdDate : timestamp,
                    editDate : timestamp,
                    elementRefId : refTrackMap[elementType] ?
                    `${elementType}${refTrackMap[elementType] + 1}` :
                    `${elementType}1`,
                    base64,
                    staticFileId,
                    staticFileUrl
                }
                clonedList.push(newObj);
                refTrackMap[elementType] = refTrackMap[elementType] + 1;
            }
        }

        //swap nestedIds with cloneIds
        for (let i = 0; i < clonedList.length; i++){
            let clonedElement = clonedList[i];
            let {
                elementType='', nestedElementIds=[], elementSettings={}
            } = clonedElement;
            let finalClone = JSON.parse(JSON.stringify(clonedElement));
            
            finalClone['nestedElementIds'] = swapCloneIds(nestedElementIds, cloneIdMap);
            if(
                [
                    'table', 'tabWrapper', 'slider', 'pdfPage', 'modal'
                ].includes(elementType)
            ){
                let {
                    columnCellElementIds=[], columnFilterElementIds=[],
                    columnHeaderElementIds=[], slideElementIds=[],
                    tabContentElementId=[], tabMenuElementId=[],
                    elementPositionMap={}, connectedPageIds=[]
                } = elementSettings;
                if(elementType === 'table'){
                    finalClone = {
                        ...finalClone,
                        elementSettings : {
                            ...finalClone['elementSettings'],
                            columnCellElementIds : swapCloneIds(columnCellElementIds, cloneIdMap),
                            columnFilterElementIds : swapCloneIds(columnFilterElementIds, cloneIdMap),
                            columnHeaderElementIds : swapCloneIds(columnHeaderElementIds, cloneIdMap)
                        }
                    }
                }else if(elementType === 'tabWrapper'){
                    finalClone = {
                        ...finalClone,
                        elementSettings : {
                            ...finalClone['elementSettings'],
                            tabContentElementId : swapCloneIds(tabContentElementId, cloneIdMap),
                            tabMenuElementId : swapCloneIds(tabMenuElementId, cloneIdMap)
                        }
                    }
                }else if(elementType === 'slider'){
                    finalClone = {
                        ...finalClone,
                        elementSettings : {
                            ...finalClone['elementSettings'],
                            slideElementIds : swapCloneIds(slideElementIds, cloneIdMap)
                        }
                    }
                }else if(elementType === 'pdfPage'){
                    let newPositionMap = {};
                    for (let k in elementPositionMap){
                        if(cloneIdMap[k]){
                            newPositionMap[cloneIdMap[k]] = elementPositionMap[k];
                        }
                    }
                    finalClone = {
                        ...finalClone,
                        elementSettings : {
                            ...finalClone['elementSettings'],
                            elementPositionMap : newPositionMap
                        }
                    }
                }else if(elementType === 'modal'){
                    let newPageIdList = [];
                    for (let k = 0; k < connectedPageIds.length; k++){
                        let connectedPageId = connectedPageIds[k];
                        if(newPageIdMap[connectedPageId]){
                            newPageIdList.push(newPageIdMap[connectedPageId]);
                        }
                    }
                    finalClone = {
                        ...finalClone,
                        elementSettings : {
                            ...finalClone['elementSettings'],
                            connectedPageIds : newPageIdList
                        }
                    }
                }
            }
            finalList.push(finalClone);
        }

        return {
            finalList,
            primaryElement : cloneIdMap[elementId],
            elementRefTracker : refTrackMap,
            clonedIdMap : cloneIdMap
        };
    }catch(e){
        console.log('/utils/appBuilder/clone/elementDeepClone catch error', e);
        return {
            error : true
        }
    }
}

const swapCloneIds = (elementIdList=[], cloneIdMap={}) => {
    let updatedNestedElementIdList = [];
    for (let z = 0; z < elementIdList.length; z++){
        let id = elementIdList[z];
        let replacementId = cloneIdMap[id];
        if(replacementId){
            updatedNestedElementIdList.push(replacementId);
        }
    }
    return updatedNestedElementIdList;
}