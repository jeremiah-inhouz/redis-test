const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');
const createWebAppRestrictions = require('../../utils/appBuilder/restrictions/createWebAppRestrictions');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');
const getApp = require('../../utils/appBuilder/getApp');
const clonePageAndElements = require('../../utils/appBuilder/clone/clonePageAndElements');
const deleteAppStaticFiles = require('../../utils/staticFile/deleteAppStaticFiles');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {encryptedPayload='', stateData={}} = reqBody;
        if(
            !encryptedPayload ||
            typeof encryptedPayload !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid query. Required fields are missing.'
                }
            });
        }

        let payload, timestamp = new Date().getTime();
        let decryptedPayload = encryptDecrypt(encryptedPayload);
        if(decryptedPayload){
            let parsedData = JSON.parse(decryptedPayload);
            if(new Date().getTime() <= parsedData['expirationTimestamp']){
                payload = parsedData['payload'];
            }
        }

        if(
            !payload ||
            typeof payload !== 'object'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid query. Required fields are missing.'
                }
            });
        }

        const {
            clonedAppId='', companyId='', version=0, variationId='',
            appName='', appType='', subdomain='', folderId='',
            settings={}, description='', parentAppId='', parentAppType='',
            projectId='', fileStorageServiceId=''
        } = payload;

        if(
            !clonedAppId ||
            typeof clonedAppId !== 'string' ||
            !appType ||
            typeof appType !== 'string' ||
            !subdomain ||
            typeof subdomain !== 'string' ||
            !appName ||
            typeof appName !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let companyObj = await CompanyCollection.findOne({
            _id : req.user['companyId']
        })
        .lean()
        .catch(e => {
            console.log('/cloneApp get company mongo error', e);
            return {error : true};
        });

        if(!companyObj){
            return res.status(404).send({
                error : {
                    message : 'Account was not found.'
                }
            });
        }

        if(companyObj && companyObj['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while finding your tenant account.'
                }
            });
        }

        if(companyObj['status'] !== 'active'){
            return res.status(402).send({
                error : {
                    message : 'Account is not active.'
                }
            });
        }

        if(
            folderId && 
            typeof folderId === 'string'
        ){
            const AppFolderCollection = mongoose.model(config.appFolderModel);
            let folder = await AppFolderCollection.findOne({
                _id : folderId,
                companyId : req.user['companyId']
            })
            .lean()
            .catch(e => {
                return false;
            });

            if(
                !folder ||
                (
                    folder && 
                    !folder['_id']
                )
            ){
                return res.send({
                    error : {
                        message : 'Folder was not found.'
                    }
                });
            }
    
            let {restrictEditAccess=false, editPermissionIds=[]} = folder;
    
            if(
                restrictEditAccess && 
                editPermissionIds.length > 0
            ){
                let isAdmin = false;
                let userPermissions = req.user['permissions'] || [];
                for (let i = 0; i < userPermissions.length; i++){
                    let permission = userPermissions[i];
                    if(config.adminPermissions.includes(permission)){
                        isAdmin = true;
                        break;
                    }
                }
    
                if(!isAdmin){
                    let hasPermission = false, userPermissionIds = req.user['permissionIdList'];
                    for (let x = 0; x < userPermissionIds.length; x++){
                        let permissionId = userPermissionIds[x];
                        if(editPermissionIds.includes(permissionId)){
                            hasPermission = true;
                            break;
                        }
                    }
                    if(!hasPermission){
                        return res.send({
                            error : {
                                message : 'Access denied. Not permitted to access app folder.'
                            }
                        })
                    }
                }
            }
        }

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        const AppPageCollection = mongoose.model(config.appPageModel);
        const AppElementCollection = mongoose.model(config.appElementModel);

        if(
            ['webApp', 'webComponent'].includes(appType) && 
            req.company && 
            config.limitedCompanyTypes.includes(req.company['companyType'])
        ){
            //validate Account
            const InhouzSubscriptionCollection = mongoose.model(config.inhouzSubscriptionsModel);
            let inhouzSubscription = await InhouzSubscriptionCollection.findOne({
                companyId : req.user['companyId'],
                active : true
            })
            .catch(e => {
                console.log('/createApp get inhouzSubscription mongo error', e);
                return {error : true}
            });

            if(!inhouzSubscription){
                return res.status(404).send({
                    error : {
                        message : 'Failed to validate account.'
                    }
                });
            }

            if(inhouzSubscription && inhouzSubscription['error']){
                return res.status(500).send({
                    error : {
                        message : 'Failed to validate account.'
                    }
                });
            }

            let limitValidation = await createWebAppRestrictions(inhouzSubscription, InhouzAppCollection, appType);
            if(limitValidation['error']){
                return res.status(500).send(limitValidation);
            }
            if(limitValidation.limitMet){
                return res.status(403).send({
                    error : {
                        message :  appType === 'webApp' ? 
                        'Your account has met its limit of non-production web applications.'
                        :
                        'Youc account has met its limit of web components'
                    }
                });
            }
        }

        //check if appName already exists.
        const existingAppOne = await InhouzAppCollection.findOne({
            appName,
            companyId : req.user['companyId']
        })
        .lean()
        .catch(e => {
            return {error : true}
        });

        if(existingAppOne && existingAppOne['error']){
            return res.send({
                error : {
                    message : 'An error occured while validating app.'
                }
            });
        }

        if(existingAppOne && existingAppOne['_id']){
            return res.send({
                error : {
                    message : 'App name is being used in a different app.'
                }
            });
        }

        if(['presentation', 'webApp'].includes(appType)){
            //check if subdomain already exists
            const existingSubdomain = await InhouzAppCollection.findOne({
                subdomain,
                appType,
                companyId : req.user['companyId']
            })
            .lean()
            .catch(e => {
                return {error : true}
            });

            if(existingSubdomain && existingSubdomain['error']){
                return res.send({
                    error : {
                        message : 'An error occured while validating subdomain.'
                    }
                });
            }

            if(existingSubdomain && existingSubdomain['_id']){
                return res.send({
                    error : {
                        message : 'Subdomain already in use in a similar app type.'
                    }
                });
            }
        }

        let appObj = await getApp(
            {
                ...payload,
                appId : clonedAppId
            }, 
            req.user, 
            req, 
            true
        );
        if(appObj['error']){
            return res.status(500).send(appObj);
        }

        let newAppId = new mongoose.Types.ObjectId().toHexString(), keyAvailable=false,
        errorGettingKey=false;
        while (!keyAvailable && !errorGettingKey){
            let appKey = await InhouzAppCollection.findOne({
                appId : newAppId
            })
            .catch(e => {
                return {
                    error : {
                        message : 'An error occured while finding app',
                        errorPayload : e
                    }
                }
            });

            if(
                appKey && 
                appKey['error']
            ){
                errorGettingKey = true;
            }

            if(!appKey || _.isEmpty(appKey)){
                keyAvailable = true;
            }

            if(appKey && appKey['_id']){
                newAppId = new mongoose.Types.ObjectId().toHexString();
            }
        }

        let {
            app={}, elements=[], pages=[], staticFileIdMap={}
        } = appObj;
        const {initialState={}} = app;

        //create inhouz app
        if(app['_id']){
            delete app['_id'];
        }
        let newApp = await InhouzAppCollection.create({
            ...app,
            initialState : {
                ...initialState,
                ...stateData
            },
            appName,
            description,
            subdomain,
            companyId : req.user['companyId'],
            hostedExternally : false,
            customDomains : [],
            folderId,
            appType,
            appId : newAppId,
            parentAppId,
            parentAppType,
            createdDate : timestamp,
            editDate : timestamp,
            createdById : req.user['_id'].toString(),
            lastUpdatedById : req.user['_id'].toString(),
            activeVersionMap : {
                original : 0
            },
            deployedVersionMap : {},
            productionDeployedVersionMap : {},
            developmentDeployedVersionMap : {},
            testDeployedVersionMap : {},
            deployed : false,
            pendingDeployment : false,
            transactionInProgress : false,
            settings,
            elementRefTracker : {},
            staticFileIdMap : parentAppType === 'document' ? {} : staticFileIdMap
        })
        .catch(e => {
            console.log('/services/appBuilder/cloneApp create InhouzApp mongo error', e);
            return {error : e}
        });

        if(newApp['error']){
            return res.status(500).send({
                error : {
                    message : `An error occured while cloning Inhouz App - ${newApp['error']['message']}`
                }
            });
        }

        let clonedObject = await clonePageAndElements({
            pages, 
            elements, 
            req,
            appId : newAppId, 
            timestamp,
            projectId,
            fileStorageServiceId,
            appType,
            appName,
            isPdfGenerator : appType === 'pdfFunction'
        });

        if(clonedObject['error']){
            await InhouzAppCollection.deleteMany({
                appId : newAppId,
                companyId : req.user['companyId']
            })
            .catch(e => {
                console.log(e)
                return {deletedCount : 0}
            });
            return res.status(500).send(clonedObject);
        }

        //update element tracker
        let trackerUpdate = await InhouzAppCollection.updateOne(
            {
                appId : newAppId,
                companyId : req.user['companyId']
            },
            {
                $set : {
                    elementRefTracker : clonedObject['elementRefTracker'],
                    staticFileIdMap : clonedObject['staticFileIdMap'] || {}
                }
            }
        )
        .catch(e => {
            console.log('/services/appBuilder/cloneApp mongo error', e);
            return {modifiedCount : 0}
        });

        if(!trackerUpdate['modifiedCount']){
            await InhouzAppCollection.deleteMany({
                appId : newAppId,
                companyId : req.user['companyId']
            })
            .catch(e => {
                console.log(e)
                return {deletedCount : 0}
            });

            await deleteAppStaticFiles({
                staticFileIdMap : clonedObject['staticFileIdMap'],
                elementIds : clonedObject['newElements'].map(elementObj => elementObj['elementId']),
                companyId,
                fileStorageServiceId,
                isPdfGenerator : appType === 'pdfFunction'
            });

            return res.status(500).send({
                error : {
                    message : 'An error occured while cloning Inhouz App - Element Ref Tracker.'
                }
            });
        }

        //insert pages
        let newPages = await AppPageCollection.insertMany(clonedObject['newPages'])
        .catch(e => {
            console.log('/services/appBuilder/cloneApp newPages catch block error', e);
            return {error : e}
        });

        if(newPages['error']){
            await InhouzAppCollection.deleteMany({
                appId : newAppId,
                companyId : req.user['companyId']
            })
            .catch(e => {
                console.log(e)
                return {deletedCount : 0}
            });

            await deleteAppStaticFiles({
                staticFileIdMap : clonedObject['staticFileIdMap'],
                elementIds : clonedObject['newElements'].map(elementObj => elementObj['elementId']),
                companyId,
                fileStorageServiceId,
                isPdfGenerator : appType === 'pdfFunction'
            });

            return res.status(500).send({
                error : {
                    message : 'An error occured while cloning Inhouz App - New page creation.'
                }
            });
        }

        //insert elements 
        let newElements = await AppElementCollection.insertMany(clonedObject['newElements'])
        .catch(e => {
            console.log('/services/appBuilder/cloneApp newElements catch block error', e);
            return {error : e}
        });

        if(newElements['error']){
            await InhouzAppCollection.deleteMany({
                appId : newAppId,
                companyId : req.user['companyId']
            })
            .catch(e => {
                console.log(e)
                return {deletedCount : 0}
            });

            await AppPageCollection.deleteMany({
                companyId : req.user['companyId'],
                pageId : clonedObject['newPages'].map((obj) => obj['pageId'])
            })
            .catch(e => {
                console.log(e);
                return {deletedCount : 0}
            });

            await deleteAppStaticFiles({
                staticFileIdMap : clonedObject['staticFileIdMap'],
                elementIds : clonedObject['newElements'].map(elementObj => elementObj['elementId']),
                companyId,
                fileStorageServiceId,
                isPdfGenerator : appType === 'pdfFunction'
            });

            return res.status(500).send({
                error : {
                    message : 'An error occured while cloning Inhouz App - New elements creation.'
                }
            });
        }

        //sync savedElements
        const SavedElementCollection = mongoose.model(config.savedAppElementModel);
        let savedElements = await SavedElementCollection.find({
            isGlobal : false,
            appId : clonedAppId,
            companyId : app['companyId']
        })
        .catch(e => {
            console.log('/services/appBuilder/cloneApp get savedElements mongo error', e);
            return {error : true}
        });

        if(
            !savedElements['error'] && 
            savedElements.length > 0
        ){
            let updatedSavedElements = [];
            for (let i = 0; i < savedElements.length; i++){
                let savedElement = JSON.parse(JSON.stringify(savedElements[i]));
                if(savedElement['_id']){
                    delete savedElement['_id'];
                }
                const {
                    cloneType='', referenceElementId=''
                } = savedElement;

                if(cloneType === 'deepCopy'){
                    updatedSavedElements.push({
                        ...savedElement,
                        appId : newAppId,
                        companyId : req.user['companyId']
                    });
                }else if(cloneType === 'reference'){
                    updatedSavedElements.push({
                        ...savedElement,
                        appId : newAppId,
                        referenceElementId : clonedObject['clonedIdMap'][referenceElementId],
                        companyId : req.user['companyId']
                    });
                }
            }

            await SavedElementCollection.create(updatedSavedElements)
            .catch(e => {
                console.log('/services/appBuilder/cloneApp sync savedElements mongo error', e);
                return {error : e}
            });
        }

        //sync savedStyles
        let savedStyleIdMap = {};
        const SavedStyleCollection = mongoose.model(config.savedAppStylesModel);
        const savedStyles = await SavedStyleCollection.find({
            isGlobal : false,
            appId : clonedAppId,
            companyId : app['companyId']
        })
        .catch(e => {
            console.log('/services/appBuilder/cloneApp get savedStyles mongo error', e);
            return {error : e}
        });

        if(
            !savedStyles['error'] && 
            savedStyles.length > 0
        ){
            let updatedSavedStyles = [];
            for (let i = 0; i < savedStyles.length; i++){
                let savedStyle = JSON.parse(JSON.stringify(savedStyles[i]));
                let newStyleId = new mongoose.Types.ObjectId().toHexString();
                savedStyleIdMap[savedStyle['_id'].toString()] = newStyleId;
                if(savedStyle['_id']){
                    delete savedStyle['_id'];
                }

                updatedSavedStyles.push({
                    ...savedStyle,
                    _id : newStyleId,
                    appId : newAppId,
                    companyId : req.user['companyId']
                });
            }

            await SavedStyleCollection.create(updatedSavedStyles)
            .catch(e => {
                console.log('/services/appBuilder/cloneApp update savedStyles mongo error', e);
                return {error : e}
            });
        }
        
        //sync style guide
        const StyleGuideCollection = mongoose.model(config.styleGuideModel);
        let styleGuides = await StyleGuideCollection.find({
            appId : clonedAppId,
            companyId : app['companyId']
        })
        .catch(e => {
            console.log('/services/appBuilder/cloneApp get styleGuides mongo error', e);
            return {error : e}
        });

        if(
            !styleGuides['error'] && 
            styleGuides.length > 0
        ){
            let updatedStyleGuides = [];
            for (let i = 0; i < styleGuides.length; i++){
                let styleGuide = JSON.parse(JSON.stringify(styleGuides[i]));
                const {
                    savedStyleId=''
                } = styleGuide;
                if(savedStyleIdMap[savedStyleId]){
                    if(styleGuide['_id']){
                        delete styleGuide['_id'];
                    }
                    updatedStyleGuides.push({
                        ...styleGuide,
                        savedStyleId : savedStyleIdMap[savedStyleId],
                        appId : newAppId,
                        companyId : req.user['companyId']
                    });
                }
            }

            await StyleGuideCollection.create(updatedStyleGuides)
            .catch(e => {
                console.log('/services/appBuilder/cloneApp create styleGuide mongo error', e);
                return {error : e};
            });
        }

        return res.send(newApp);
    }catch(e){
        console.log('/services/appBuilder/cloneApp catch error', e);
        return res.send({
            error : {
                message : 'An error occured while cloning app.'
            }
        })
    }
}