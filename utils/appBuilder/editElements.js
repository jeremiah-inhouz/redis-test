const mongoose = require('mongoose');
const moment = require('moment');
const config = require('../../config/config')();
const _ = require('lodash');
const deleteAppStaticFiles = require('../staticFile/deleteAppStaticFiles');
const uploadPdfStaticFile = require('../staticFile/uploadPdfStaticFile');
const getFileStorageCredentials = require('../inhouzCloudStorage/getFileStorageCredentials');

module.exports = async (data={}, inhouzApp={}, companyId='', user={}) => {
    try{
        const {
            elements=[], versionToUpdate=0, deletedElementIds=[],
            variationId='original', appId='', fileStorageServiceId='',
            isInhouzSign=false, projectId='', isPdfGenerator=false
        } = data;

        const timestamp = data['timestamp'] || new Date().getTime();
        let {
            activeVersionMap={}, appType='', appName=''
        } = inhouzApp;
        let activeVersion = activeVersionMap[variationId || 'original'];
        const AppElementCollection = mongoose.model(config.appElementModel);
        const StaticFileCollection = mongoose.model(config.inhouzSignStaticFileModel);
        let nextVersion = activeVersion + 1, versionInFocus = versionToUpdate || activeVersion;
        let ignoredElementIds = [...deletedElementIds], newElements = [], error=false;
        let staticFileIdMap = {}, fileStorageCredentials={};

        if(isInhouzSign){
            fileStorageCredentials = await getFileStorageCredentials({
                fileStorageServiceId,
                companyId,
                hostedExternally : fileStorageServiceId ? true : false
            });

            if(fileStorageCredentials['error']){
                return {
                    error : {
                        message : 'Failed to generate file storage credentials.'
                    }
                }
            }
        }

        let newElementList = [], processedElements={};
        for (let i = 0; i < elements.length; i++){
            let elementObj = elements[i];
            let {
                action='', element={}
            } = elementObj;

            if(processedElements[element['elementId']]){
                continue;
            }
            
            if(element['_id']){
                delete element['_id'];
            }

            if(
                element['base64'] && 
                config.documentAppTypes.includes(appType)
            ){
                let nameSplit = appName.split('_');
                let fileKey = `${nameSplit.slice(0, nameSplit.length - 1).join('_').split('.').join('_')}_INHOUZKEY_${element['elementId']}_${new Date().getTime()}.jpeg`;
                let fileUploadResponse = await uploadPdfStaticFile({
                    fileStorageServiceId,
                    base64 : element['base64'],
                    fileType : 'image/jpeg',
                    fileKey,
                    fileName : fileKey,
                    companyId,
                    fileStorageCredentials,
                    projectId,
                    fileOrigin : 'inhouz app',
                    fileOriginId : appId,
                    metaTag : 'inhouz app element embedded pdf',
                    bucketName : !fileStorageServiceId ? 
                    isPdfGenerator ? 
                    config.inhouzPdfGeneratorDraftBucketName
                    :
                    config.inhouzSignDraftBucketName 
                    : 
                    '',
                    user,
                    returnSignedUrl : true,
                    expirationTimestamp : moment().add(1000, 'years').unix() * 1000
                });

                if(fileUploadResponse['error']){
                    error = true;
                    break;
                }

                staticFileIdMap[element['elementId']] = fileKey;
                element['staticFileId'] = fileKey;
                element['staticFileUrl'] = fileUploadResponse['fileUrl'];
                delete element['base64'];

                // let staticFileUpload = await StaticFileCollection.create({
                //     base64 : element['base64'],
                //     companyId,
                //     appId
                // })
                // .catch(e => {
                //     console.log('/editElements staticFileUpload catch error', e);
                //     return {error : true}
                // });

                // if(staticFileUpload['_id']){
                //     staticFileIdMap[element['elementId']] = staticFileUpload['_id'].toString();
                //     delete element['base64'];
                //     element['staticFileId'] = staticFileUpload['_id'].toString();
                // }
            }   
            
            // let newElement = await AppElementCollection.create({
            //     ...element,
            //     companyId,
            //     variationId,
            //     versionTracker : [{version : nextVersion}],
            //     createdDate : timestamp,
            //     createdById : user['_id'],
            //     editDate : timestamp,
            //     lastUpdatedById : user['_id']
            // })
            // .catch(e => {
            //     console.log('utils/appBuilder/editElements create element catch error', e)
            //     return false;
            // });

            // if(!newElement){
            //     error = true;
            //     break;
            // }

            // newElements.push(JSON.parse(JSON.stringify(newElement)));

            newElementList.push({
                ...element,
                companyId,
                variationId,
                versionTracker : [{version : nextVersion}],
                createdDate : timestamp,
                createdById : user['_id'],
                editDate : timestamp,
                lastUpdatedById : user['_id']
            });

            if(action === 'edit'){
                ignoredElementIds.push(element['elementId']);
            }

            processedElements[element['elementId']] = true;
        }

        newElements = await AppElementCollection.insertMany(newElementList)
        .catch(e => {
            console.log('/editElements create newElements mongo error', e);
            return {error : true}
        });

        if(newElements['error']){
            error = true;
        }

        if(error){
            if(newElementList.length > 0){
                if(
                    config.documentAppTypes.includes(appType)
                ){
                    deleteAppStaticFiles({
                        elementIds : newElementList.map(element => element['elementId']),
                        companyId,
                        staticFileIdMap : {
                            ...staticFileIdMap,
                            ...(inhouzApp['staticFileIdMap'] || {})
                        },
                        isPdfGenerator
                    });
                }

                // await AppElementCollection.deleteMany({
                //     _id : {
                //         $in : newElements.map(element => element['_id'].toString())
                //     },
                //     companyId
                // })
                // .catch(e => {
                //     console.log('/editElements deleteElements mongo error 1', e);
                //     return {deletedCount : 0}
                // });
            }

            return {
                error : {
                    message : 'App update failed.',
                    errorPayload : 'Failed to create new element(s)'
                }
            }
        }

        //update every current element to the next version
        let versionUpdateResponse = await AppElementCollection.updateMany(
            {
                appId,
                companyId,
                'versionTracker.version' : versionInFocus,
                variationId,
                elementId : {
                    $nin : ignoredElementIds
                }
            },
            {
                $push : {
                    versionTracker : {version : nextVersion}
                }
            }
        )
        .catch(e => {
            console.log('/editElements updateElements verion mongo error', e);
            return {error : true}
        });

        if(versionUpdateResponse['error']){
            if(newElements.length > 0){
                if(
                    config.documentAppTypes.includes(appType)
                ){
                    deleteAppStaticFiles({
                        elementIds : newElements.map(element => element['elementId']),
                        companyId,
                        fileStorageServiceId,
                        staticFileIdMap : {
                            ...staticFileIdMap,
                            ...(inhouzApp['staticFileIdMap'] || {})
                        },
                        isPdfGenerator
                    });
                }

                await AppElementCollection.deleteMany({
                    _id : {
                        $in : newElements.map(element => element['_id'].toString())
                    },
                    companyId
                })
                .catch(e => {
                    console.log('/editElements deleteElements mongo error 2', e);
                    return {deletedCount : 0}
                });
            }

            return {
                error : {
                    message : 'App update failed.',
                    errorPayload : 'Failed to update existing elements to the next version'
                }
            }
        }

        if(
            config.documentAppTypes.includes(appType) &&
            deletedElementIds.length > 0
        ){
            deleteAppStaticFiles({
                elementIds : deletedElementIds,
                companyId,
                fileStorageServiceId,
                staticFileIdMap : {
                    ...staticFileIdMap,
                    ...(inhouzApp['staticFileIdMap'] || {})
                },
                isPdfGenerator
            });
        }

        return {
            success : true,
            nextVersion,
            elements : newElements,
            staticFileIdMap
        }
    }catch(e){
        console.log('/utils/appBuilder/editInhouzElements catch error', e);
        return {
            error : {
                message : 'App update failed.',
                errorPayload : 'Failed to edit app elements.'
            }
        }
    }
}