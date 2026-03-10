const config = require('../../../config/config')();
const {orderBy} = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const elementDeepClone = require('./elementDeepClone');
const copyPdfStaticFile = require('../../staticFile/copyPdfStaticFile');
const deleteCloudStorageFile = require('../../staticFile/deleteCloudStorageFile');

module.exports = async (params={}) => {
    try{
        let {
            pages=[], elements=[], req, appId='', timestamp=0,
            projectId='', fileStorageServiceId='', appType='',
            appName='', isPdfGenerator=false
        } = params;

        let orderedPages = orderBy(pages, 'pageNumber', 'asc');
        //map elements
        let appElementsMap={}, rootElementMap={}, 
        newPageIdMap={}, newPages=[], newElements=[],
        elementRefTracker={}, clonedIdMap={};
        for (let i = 0; i < elements.length; i++){
            let element = JSON.parse(JSON.stringify(elements[i]));
            if(element['_id']){
                delete element['_id'];
            }
            const {
                pageId='', rootElement=false, elementId=''
            } = element;
            if(!appElementsMap[elementId]){
                appElementsMap[elementId] = element;
            }
            if(rootElement && pageId){
                rootElementMap[pageId] = elementId;
            }
        }

        let hasError = false;
        for (let i = 0; i < orderedPages.length; i++){
            let page = JSON.parse(JSON.stringify(orderedPages[i]));
            if(page['_id']){
                delete page['_id'];
            }
            let newPageId = new mongoose.Types.ObjectId().toHexString();
            newPageIdMap[page['pageId']] = newPageId;
            newPages.push({
                ...page,
                appId,
                companyId : req.user['companyId'],
                pageId : newPageId,
                restrictPageAccess : false,
                lastUpdatedById : req.user['_id'].toString(),
                createdById : req.user['_id'].toString(),
                createdDate : timestamp,
                editDate : timestamp,
                versionTracker : [{version : 0}]
            });
            let clonedElementObject = elementDeepClone({
                elementId : rootElementMap[page['pageId']],
                appElementsMap,
                appId,
                req,
                elementRefTracker,
                pageId : newPageId,
                timestamp,
                clonedIdMap,
                newPageIdMap
            });

            if(clonedElementObject['error']){
                hasError = true;
                break;
            }

            elementRefTracker = clonedElementObject['elementRefTracker'];
            clonedIdMap = clonedElementObject['clonedIdMap'];
            newElements.push(...clonedElementObject['finalList']);
        }

        if(hasError){
            return {
                error : {
                    message : 'An error occured while cloning pages and elements.'
                }
            }
        }

        let finalElementList = [], staticFileIdMap={};
        if(['inhouzSign', 'pdfFunction'].includes(appType)){
            for (let i = 0; i < newElements.length; i++){
                let element = newElements[i];
                if(element['staticFileId']){
                    let nameSplit = appName.split('_');
                    let fileKey = `${nameSplit.slice(0, nameSplit.length - 1).join('_').split('.').join('_')}_INHOUZKEY_${element['elementId']}_${new Date().getTime()}.jpeg`;
                    let fileCopyResponse = await copyPdfStaticFile({
                        fileStorageServiceId,
                        fromFileKey : element['staticFileId'],
                        toFileKey : fileKey,
                        companyId : element['companyId'],
                        user : req.user,
                        appId,
                        projectId,
                        bucketName : !fileStorageServiceId ? 
                        isPdfGenerator ?
                        config.inhouzPdfGeneratorDraftBucketName
                        :
                        config.inhouzSignDraftBucketName 
                        : 
                        '',
                        returnSignedUrl : true,
                        expirationTimestamp : moment().add(1000, 'years').unix() * 1000
                    });

                    if(fileCopyResponse['error']){
                        hasError = true;
                        break;
                    }

                    staticFileIdMap[element['elementId']] = fileKey;
                    element['staticFileId'] = fileKey;
                    element['staticFileUrl'] = fileCopyResponse['fileUrl'];
                    if(element['base64']){
                        delete element['base64'];
                    }

                    finalElementList.push(element);
                }else{
                    finalElementList.push(element);
                }
            }

            if(hasError){
                //delete static files
                let toDeleteStaticFileIdList = [];
                for (let k in staticFileIdMap){
                    let fileId = staticFileIdMap[k];
                    toDeleteStaticFileIdList.push(fileId);
                }

                for (let t = 0; t < toDeleteStaticFileIdList.length; t++){
                    let keyId = toDeleteStaticFileIdList[t];
                    await deleteCloudStorageFile({
                        fileStorageServiceId,
                        fileKey : keyId,
                        bucketName : isPdfGenerator ? 
                        config.inhouzPdfGeneratorDraftBucketName
                        :
                        config.inhouzSignDraftBucketName,
                        companyId
                    });
                }

                return {
                    error : {
                        message : 'Failed to copy static files.'
                    }
                }
            }
        }else{
            finalElementList = newElements
        }

        return {
            newPages,
            newElements : finalElementList,
            elementRefTracker,
            clonedIdMap,
            staticFileIdMap
        }
    }catch(e){
        console.log('/utils/appBuilder/clone/clonePageAndElements catch error', e);
        return {
            error : {
                message : 'Failed while cloning app pages and elements.'
            }
        }
    }
}