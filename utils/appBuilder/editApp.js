const mongoose = require('mongoose');
const config = require('../../config/config')();
const _ = require('lodash');
const updateAppObject = require('./updateAppObject');
const editElements = require('./editElements');
const editPages = require('./editPages');
const getApp = require('./getApp');
const server = require('../../server');
const editAppErrorHandling = require('./editAppErrorHandling');
const getAppFunctions = require('../functions/getAppFunctions');
const calculateUserAccess = require('./access/calculateUserAccess');
const encryptDecrypt = require('../cryptography/encryptDecrypt');
const {compress} = require('shrink-string');
const deleteAppStaticFiles = require('../staticFile/deleteAppStaticFiles');

module.exports = async (data={}, user={}, queueId='', decryptedCompanyId='') => {
    let appid='', InhouzAppCollection,
    inhouzApp, versionInFocus, nextVersion, editElementsResponse={}, editPagesResponse={},
    companyId='';
    try{
        const {
            elements=[], versionToUpdate=0, deletedElementIds=[],
            variationId='original', encryptedCompanyId='', appId='',
            appObject={}, pages=[], deletedPageIds=[], browserId='',
            environment=''
        } = data;

        //decrypt companyId
        if(!decryptedCompanyId){
            let decryptedData = encryptDecrypt(encryptedCompanyId);
            if(decryptedData){
                let parsedData = JSON.parse(decryptedData);
                if(new Date().getTime() <= parsedData['expirationTimestamp']){
                    companyId = parsedData['companyId'];
                }
            }
        }else{
            companyId = decryptedCompanyId
        }

        if(
            !companyId ||
            !appId ||
            typeof appId !== 'string' ||
            typeof companyId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(companyId)
        ){
            return {
                error : {
                    message : 'Required fields are missing in update.'
                }
            }
        }

        appid = appId;
        const timestamp = data['timestamp'] || new Date().getTime();
        InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        const AppUpdateQueueCollection = mongoose.model(config.appUpdateQueueModel);

        //check if item is queued and if queue has been processed
        if(queueId){
            let queueItem = await AppUpdateQueueCollection.findOne({
                _id : queueId,
                processed : false
            })
            .lean()
            .catch(e => {
                return false
            });

            if(!queueItem){
                return {
                    parsed : true
                }
            }
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let companyObj = await CompanyCollection.findOne({
            _id : companyId
        })
        .lean()
        .catch(e => {
            console.log('/utils/editApp get company mongo error', e);
            return {error : true};
        });

        if(!companyObj){
            return {
                error : {
                    message : 'Account was not found.'
                }
            }
        }

        if(companyObj && companyObj['error']){
            return {
                error : {
                    message : 'An error occurred while finding your tenant account.'
                }
            }
        }

        if(companyObj['status'] !== 'active'){
            return {
                error : {
                    message : 'Account is not active.'
                }
            }
        }

        //get app object
        inhouzApp = await InhouzAppCollection.findOne({
            companyId,
            appId
        })
        .lean()
        .catch(e => {
            return false
        });

        if(!inhouzApp){
            return {
                error : {
                    message : 'App was not found.'
                }
            }
        }

        let hasWriteAccess = calculateUserAccess(inhouzApp, user, 'writeAccess');
        if(!hasWriteAccess){
            return {
                error : {
                    message : 'Not authorized to edit app'
                }
            }
        }

        let {
            activeVersionMap={}, staticFileIdMap={}, appType='',
            parentAppType='', parentAppId=''
        } = inhouzApp;
        let activeVersion = activeVersionMap[variationId || 'original'];
        nextVersion = activeVersion + 1; 
        versionInFocus = versionToUpdate || activeVersion;

        //mark app as transaction in progress
        // const inProgressResponse = await InhouzAppCollection.updateOne(
        //     {
        //         companyId,
        //         appId,
        //         transactionInProgress : false
        //     },
        //     {
        //         $set : {
        //             transactionInProgress : true,
        //             editDate : timestamp
        //         }
        //     }
        // )
        // .catch(e => {
        //     console.log('/editApp mark transactionInProgress mongo error', e);
        //     return {error : true}
        // });

        // if(inProgressResponse['error']){
        //     return {
        //         error : {
        //             message : 'App update failed.',
        //             errorPayload : 'Failed to mark app as transaction in progress'
        //         }
        //     }
        // }

        // if(
        //     !inProgressResponse['modifiedCount']
        // ){
        //     return {
        //         error : {
        //             message : 'Failed to initialize edit. An update transaction might currently be in progress.'
        //         }
        //     }
        //     if(queueId){
        //         return {
        //             transactionInProgress : true
        //         }
        //     }else{
        //         let newQueueUpdate = await AppUpdateQueueCollection.create({
        //             companyId,
        //             appId,
        //             elements,
        //             variationId,
        //             deletedElementIds,
        //             timestamp,
        //             versionToUpdate,
        //             createdById : user['_id'],
        //             pages,
        //             deletedPageIds,
        //             appObject
        //         })
        //         .catch(e => {
        //             return {error : true}
        //         });

        //         if(newQueueUpdate && newQueueUpdate['error']){
        //             await InhouzAppCollection.updateOne(
        //                 {
        //                     companyId,
        //                     appId
        //                 },
        //                 {
        //                     $set : {
        //                         transactionInProgress : false
        //                     }
        //                 }
        //             )
        //             .catch(e => {
        //                 return {modifiedCount : 0}
        //             });

        //             return {
        //                 error : {
        //                     message : 'App update failed'
        //                 }
        //             }
        //         }else{
        //             return {
        //                 addedToQueue : true
        //             }
        //         }
        //     }
        // }

        //update app object
        let updateAppObjectResponse = await updateAppObject(appObject, appId, companyId);
        if(updateAppObjectResponse['error']){
            //reverse update function
            await editAppErrorHandling(
                appId, companyId, inhouzApp, 
                [], [], versionInFocus,
                nextVersion, variationId
            );
            return updateAppObjectResponse;
        }

        //update app pages
        editPagesResponse = await editPages(data, inhouzApp, companyId, user);
        if(editPagesResponse['error']){
            //reverse update function
            await editAppErrorHandling(
                appId, companyId, inhouzApp, 
                [], editPagesResponse['pages'], versionInFocus,
                nextVersion, variationId
            );
            return editPagesResponse;
        }

        let docObject = {}, isInhouzSign=false;
        if(appType === 'inhouzSign'){
            isInhouzSign = true;
            if(parentAppType === 'template'){
                const InhouzSignTemplateCollection = mongoose.model(config.inhouzSignTemplateModel);
                docObject = await InhouzSignTemplateCollection.findOne({
                    _id : parentAppId,
                    companyId
                })
                .lean()
                .catch(e => {
                    console.log('/editApp getInhouzSignTemplate mongo error', e);
                    return {error : true};
                });
            }else{
                const InhouzSignDocumentCollection = mongoose.model(config.inhouzSignDocModel);
                docObject = await InhouzSignDocumentCollection.findOne({
                    _id : parentAppId,
                    companyId
                })
                .lean()
                .catch(e => {
                    console.log('/editApp getInhouzSignDocument mongo error', e);
                    return {error : true};
                });
            }

            if(
                !docObject ||
                (
                    docObject && 
                    docObject['error']
                )
            ){
                await editAppErrorHandling(
                    appId, companyId, inhouzApp, 
                    [], editPagesResponse['pages'], versionInFocus,
                    nextVersion, variationId
                );

                return {
                    error : {
                        message : !docObject ?
                        `Inhouz Sign ${parentAppType} was not found.`
                        :
                        `An error occurred while finding Inhouz Sign ${parentAppType} document.`
                    }
                }
            }
        }else if(appType === 'pdfFunction'){
            const PdfGeneratorTemplateCollection = mongoose.model(config.pdfGeneratorTemplateModel);
            docObject = await PdfGeneratorTemplateCollection.findOne({
                _id : parentAppId,
                companyId
            })
            .lean()
            .catch(e => {
                console.log('/deleteInhouzApp getPdfGeneratorTemplate mongo error', e);
                return {error : true};
            });

            if(
                !docObject ||
                (
                    docObject && 
                    docObject['error']
                )
            ){
                await editAppErrorHandling(
                    appId, companyId, inhouzApp, 
                    [], editPagesResponse['pages'], versionInFocus,
                    nextVersion, variationId
                );

                return {
                    error : {
                        message : !docObject ?
                        `PDF generator ${parentAppType} was not found.`
                        :
                        `An error occurred while finding PDF generator ${parentAppType} document.`
                    }
                }
            }
        }

        //update app elements
        editElementsResponse = await editElements(
            {
                ...data,
                isInhouzSign,
                fileStorageServiceId : docObject['draftFileStorageServiceId'] || '',
                projectId : docObject['projectId'],
                isPdfGenerator : appType === 'pdfFunction'
            }, 
            inhouzApp, 
            companyId, 
            user
        );
        if(editElementsResponse['error']){
            //reverse update function
            // if(config.documentAppTypes.includes(appType)){
            //     deleteAppStaticFiles({
            //         companyId,
            //         staticFileIdMap : editElementsResponse['staticFileIdMap'] || {},
            //         deleteApp : true
            //     });
            // }
            await editAppErrorHandling(
                appId, companyId, inhouzApp, 
                editElementsResponse['elements'], editPagesResponse['pages'], versionInFocus,
                nextVersion, variationId
            );
            return editElementsResponse;
        }

        //update app with the next version and release
        let appVersionUpdateResponse = await InhouzAppCollection.updateOne(
            {
                companyId,
                appId
            },
            {
                $set : {
                    transactionInProgress : false,
                    activeVersionMap : {
                        ...activeVersionMap,
                        [variationId || 'original'] : nextVersion
                    },
                    staticFileIdMap : {
                        ...staticFileIdMap,
                        ...(editElementsResponse['staticFileIdMap'] || {})
                    }
                }
            }
        )
        .catch(e => {
            console.log('/editApp appVersionUpdate mongo error', e);
            return {modifiedCount : 0}
        });
        
        if(!appVersionUpdateResponse['modifiedCount']){
            //reverse update function
            if(config.documentAppTypes.includes(appType)){
                deleteAppStaticFiles({
                    elementIds : editElementsResponse['elements'].map(elementObj => elementObj['elementId']),
                    companyId,
                    fileStorageServiceId : docObject['draftFileStorageServiceId'] || '',
                    staticFileIdMap : editElementsResponse['staticFileIdMap'] || {},
                    isPdfGenerator : appType === 'pdfFunction'
                    // deleteApp : true
                });
            }
            await editAppErrorHandling(
                appId, companyId, inhouzApp, 
                editElementsResponse['elements'], editPagesResponse['pages'], versionInFocus,
                nextVersion, variationId
            );

            return {
                error : {
                    message : 'App update failed.',
                    errorPayload : 'Failed to update app version after edit'
                }
            }
        }

        //mark queued item as processed
        if(queueId){
            await AppUpdateQueueCollection.updateOne(
                {
                    _id : queueId
                },
                {
                    $set : {
                        processed : true
                    }
                }
            )
            .catch(e => {
                console.log('/editApp appUpdateQueue processed mongo error', e);
                return {modifiedCount : 0}
            });
        }

        //get current instance of app
        // let updatedApp = await getApp({
        //     appId,
        //     variationId,
        //     version : nextVersion,
        //     skipElements : true
        // }, user);

        const updatedAppObj = await InhouzAppCollection.findOne({
            companyId,
            appId
        })
        .lean()
        .catch(e => {
            return false
        });

        if(!updatedAppObj){
            return {
                error : {
                    message : 'An error occurred while finding updated app.'
                }
            };
        }

        //get functions
        let functionMap = await getAppFunctions(updatedAppObj || {}, environment)

        try{
            let updatePayload = {
                functionMap : functionMap['error'] ? {} : functionMap,
                // elements : updatedApp['elements'] || [],
                // pages : updatedApp['pages'] || [],
                appObject : updatedAppObj || appObject
            }
            let compressedPayload = await compress(JSON.stringify(updatePayload));
            server.getSocketIoInstance().sockets.to(`${appId}-${variationId}`).emit('App builder update', {
                nextVersion,
                updatedById : user['_id'],
                variationId,
                versionToQuery : versionToUpdate,
                appId,
                browserId,
                success : true,
                compressedPayload
            });
        }catch(e){
            console.log('/editApp socketIoResponse error', e);
        }

        return {
            // elements : updatedApp['elements'] || [],
            // pages : updatedApp['pages'] || [],
            // appObject : updatedApp['app'] || appObject,
            appObject : updatedAppObj || appObject,
            nextVersion,
            updatedById : user['_id'],
            variationId,
            versionToQuery : versionToUpdate,
            functionMap : functionMap['error'] ? {} : functionMap,
            appId,
            success : true
        }
    }catch(e){
        console.log('/utils/appBuilder/editApp catch error', e);
        // InhouzAppCollection.updateOne(
        //     {
        //         appId : appid
        //     },
        //     {
        //         $set : {
        //             transactionInProgress : false
        //         }
        //     }
        // )
        // .catch(e => {
        //     return {modifiedCount : 0}
        // });

        await editAppErrorHandling(
            appid, companyId, inhouzApp, 
            (editElementsResponse && editElementsResponse['elements']) || [], 
            (editPagesResponse && editPagesResponse['pages']) || [], 
            versionInFocus,
            nextVersion, 'original'
        );

        return {
            error : {
                message : 'App update failed.'
            }
        }
    }
}