const mongoose = require('mongoose');
const config = require('../../config/config')();
const getAppFunctions = require('../functions/getAppFunctions');
const calculateUserAccess = require('./access/calculateUserAccess');
const AWS = require('aws-sdk');
const recursiveGetMissingEmbeddedElements = require('./element/recursiveGetMissingEmbeddedElements');

module.exports = async (params={}, user={}, req, clone=false) => {
    try{
        const {
            appId='', version=0, variationId='', abTestId='',
            skipElements=false, skipAccessCheck=false,
            efficientMode=false, slug='', skipFunctions=false,
            modalMode=false, skipPages=false, environment='',
            elementLimitCount=0, elementSkipCount=0, getElementCount=false,
            paginationMode=false
        } = params;

        if(
            !appId ||
            typeof appId !== 'string'
        ){
            return {
                error : {
                    message : 'Invalid request. appId is a required query.'
                }
            };
        }

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        let app = await InhouzAppCollection.findOne({
            appId
        })
        .lean()
        .catch(e => {
            return {error : true}
        });

        if(
            !app
        ){
            return {
                error : {
                    message : 'App was not found.'
                }
            };
        }

        if(app && app['error']){
            return {
                error : {
                    message : 'An error occured while getting app.'
                }
            };
        }

        if(!skipAccessCheck && !paginationMode){
            let hasReadAccess = calculateUserAccess(app, user, 'readAccess');
            if(!hasReadAccess){
                return {
                    error : {
                        message : 'Not authorized to view app'
                    }
                }
            }
        }

        let CompanyCollection = mongoose.model(config.companyModel);
        let company = await CompanyCollection.findOne({
            _id : app['companyId'],
            status : 'active'
        })
        .lean()
        .catch(e => {
            console.log('/getApp/getCompany mongo error', e);
            return {error : true}
        });

        if(!company){
            return res.status(404).send({
                error : {
                    message : 'Account was not found.'
                }
            })
        }

        if(company && company['error']){
            return {
                error : {
                    message : 'Failed to validate account.'
                }
            }
        }

        if(
            !clone && 
            !paginationMode &&
            (app['companyId'] !== (user['assetOwnerCompanyId'] || user['companyId']))
        ){
            if(
                (company['companyType'] === 'freelancer') ||
                (
                    req && 
                    req.company &&
                    req.company['companyType'] === 'freelancer'
                )
            ){
                return res.status(403).send({
                    error : {
                        message : 'Freelancer accounts are not eligible for third-party collaboration.'
                    }
                });
            }
        }

        const {activeVersionMap={}, settings={}} = app;
        const {imageFileKey=''} = settings;
        let activeVersion = activeVersionMap[variationId || 'original'];
        const versionInFocus = version || activeVersion;
        //query elements
        const AppElementCollection = mongoose.model(config.appElementModel);
        let query = {
            appId,
            companyId : app['companyId'],
            'versionTracker.version' : versionInFocus,
            variationId : variationId || 'original'
        }

        //resolve any abTest variations
        if(
            abTestId && 
            typeof abTestId === 'string' && 
            variationId && 
            typeof variationId === 'string'
        ){
            const AbTestCollection = mongoose.model(config.abTestsModel);
            let abTest = await AbTestCollection.findOne({
                appId,
                _id : abTestId
            })
            .lean()
            .catch(e => {
                return {error : true};
            });

            if(abTest && abTest['error']){
                return {
                    error : {
                        message : 'An error occured while resolving AB Test variations.'
                    }
                };
            }

            if(abTest && abTest['_id']){
                if(
                    Array.isArray(abTest['versionTracker']) && 
                    abTest['versionTracker'].includes(versionInFocus)
                ){
                    query['hasVariation'] = false;
                    query['variationId'] = variationId;
                }
            }
        }

        //get pages
        let AppPageCollection = mongoose.model(config.appPageModel);
        let pages = [];
        if(!skipPages){
            pages = await AppPageCollection.find({
                appId,
                companyId : app['companyId'],
                'versionTracker.version' : versionInFocus
            }, {versionTracker : 0})
            .catch(e => {
                console.log('/getApp getPages mongo error', e)
                return {error : true}
            });
    
            if(pages && pages['error']){
                return {
                    error : {
                        message : 'An error occured while resolving app pages/views.'
                    }
                };
            }
        }

        let pageId = params['pageId'] || '', page404Id='';
        if(efficientMode && !pageId){
            for (let i = 0; i < pages.length; i++){
                let pageObj = pages[i];
                if(pageObj['slug'] === slug){
                    pageId = pageObj['pageId'];
                }else if(pageObj['is404Page']){
                    page404Id = pageObj['pageId'];
                }
            }

            if(!pageId && page404Id){
                pageId = page404Id;
            }
        }

        //get elements
        let elements=[], totalElementCount=0, extraElementQuery={};
        if(!skipElements){
            if(pageId && !modalMode){
                extraElementQuery['pageId'] = pageId;
            }
            if(efficientMode){
                extraElementQuery['elementType'] = {
                    $nin : ['modal']
                };
            }

            if(!modalMode){
                elements = await AppElementCollection.find(
                    {
                        ...query,
                        ...extraElementQuery
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
                .skip(elementSkipCount)
                .limit(elementLimitCount)
                .catch(e => {
                    console.log('/getApp getElements mongo error', e)
                    return {error : true}
                });
            }else{
                let modalElements = await AppElementCollection.aggregate([
                    {
                        $match : {
                            ...query,
                            elementType : 'modal'
                        }
                    },
                    {
                        $graphLookup : {
                            from : config.appElementModel,
                            startWith : '$nestedElementIds',
                            connectFromField : 'nestedElementIds',
                            connectToField : 'elementId',
                            as : 'elements',
                            restrictSearchWithMatch : {
                                'versionTracker.version' : versionInFocus
                            }
                        }
                    }
                ])
                .catch(e => {
                    console.log('/getApp getModalElements mongo error', e)
                    return {error : true}
                });

                if(modalElements && modalElements['error']){
                    return {
                        error : {
                            message : 'An error occured while resolving app modal elements.'
                        }
                    };
                }

                for (let f = 0; f < modalElements.length; f++){
                    let modalElement = modalElements[f];
                    if(
                        modalElement.elements
                    ){
                        elements.push(...modalElement.elements);
                        delete modalElement.elements;
                        elements.push(modalElement)
                    }
                }
            }

            if(elements && elements['error']){
                return {
                    error : {
                        message : 'An error occured while resolving app elements.'
                    }
                };
            }

            if(efficientMode){
                // let modalElements = await AppElementCollection.aggregate([
                //     {
                //         $match : {
                //             ...query,
                //             elementType : 'modal'
                //         }
                //     },
                //     {
                //         $graphLookup : {
                //             from : config.appElementModel,
                //             startWith : '$nestedElementIds',
                //             connectFromField : 'nestedElementIds',
                //             connectToField : 'elementId',
                //             as : 'elements',
                //             restrictSearchWithMatch : {
                //                 'versionTracker.version' : versionInFocus
                //             }
                //         }
                //     }
                // ])
                // .catch(e => {
                //     console.log('/getApp getModalElements mongo error', e)
                //     return {error : true}
                // });

                // if(modalElements && modalElements['error']){
                //     return {
                //         error : {
                //             message : 'An error occured while resolving app modal elements.'
                //         }
                //     };
                // }
                // console.log('modalElements', modalElements)
                // for (let f = 0; f < modalElements.length; f++){
                //     let modalElement = modalElements[f];
                //     if(
                //         modalElement.elements
                //     ){
                //         elements.push(...modalElement.elements);
                //         delete modalElement.elements;
                //         elements.push(modalElement)
                //     }
                // }

                let elementMap = {};
                for (let i = 0; i < elements.length; i++){
                    let elementObj = elements[i];
                    elementMap[elementObj['elementId']] = true;
                }

                //get missing elements
                for (let i = 0; i < elements.length; i++){
                    let elementObj = elements[i];
                    let {nestedElementIds=[]} = elementObj;
                    if(nestedElementIds.length > 0){
                        let missingIdList = [];
                        for (let z = 0; z < nestedElementIds.length; z++){
                            let nestedElementId = nestedElementIds[z];
                            if(!elementMap[nestedElementId]){
                                missingIdList.push(nestedElementId);
                            }
                        }
                        if(missingIdList.length > 0){
                            let missingElements = await recursiveGetMissingEmbeddedElements(
                                missingIdList,
                                elementMap,
                                query
                            );

                            if(missingElements.length > 0){
                                elements.push(...missingElements);
                                for (let k = 0; k < missingElements.length; k++){
                                    elementMap[missingElements[k]['elementId']] = true;
                                }
                            }
                        }   
                    }
                }
            }
        }

        if(getElementCount){
            totalElementCount = await AppElementCollection.count({
                ...query,
                ...extraElementQuery
            })
            .catch(e => {
                console.log('/getApp getElementCount mongo error', e)
                return {error : true}
            });

            if(totalElementCount['error']){
                return {
                    error : {
                        message : 'An error occurred while getting element count.'
                    }
                }
            }
        }

        //get 2D function map for in-app performance
        let functionMap = {}
        if(!skipFunctions){
            functionMap = await getAppFunctions(app, environment || 'development');
        }

        let appLogoImageUrl=''
        if(imageFileKey){
            const s3 = new AWS.S3({
                accessKeyId : config.s3AccessKeyId,
                secretAccessKey : config.s3SecretKey
            });
            appLogoImageUrl = s3.getSignedUrl('getObject', {
                Bucket : config.s3BucketName,
                Key : imageFileKey,
                Expires : 604800 //1 week
            });
        }

        return {
            app : {
                ...JSON.parse(JSON.stringify(app)),
                appLogoImageUrl
            },
            elements,
            pages,
            versionInFocus,
            activeVersion,
            functionMap : functionMap['error'] ? {} : functionMap,
            assetOwnerSubdomain : company['subDomain'],
            pageId,
            efficientMode,
            totalElementCount
        };
    }catch(e){
        console.log('/utils/appBuilder/getApp catch error', e)
        return {
            error : {
                message : 'Failed to get app'
            }
        };
    }
}