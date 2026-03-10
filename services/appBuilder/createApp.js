const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');
const createInitPage = require('../../utils/appBuilder/page/createInitPage');
const createWebAppRestrictions = require('../../utils/appBuilder/restrictions/createWebAppRestrictions');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appName='', appType='', subdomain='', folderId=''
        } = reqBody;

        if(
            !appName ||
            !appType ||
            typeof appName !== 'string' ||
            typeof appType !== 'string' ||
            (
                (
                    !subdomain ||
                    typeof subdomain !== 'string'
                ) && 
                ['presentation', 'webApp'].includes(appType)
            )
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields such as appName, appType, or subdomain are missing.'
                }
            });
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let companyObj = await CompanyCollection.findOne({
            _id : req.user['companyId']
        })
        .lean()
        .catch(e => {
            console.log('/createApp get company mongo error', e);
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

        let datestamp = new Date().getTime();
        let appId = new mongoose.Types.ObjectId().toHexString(), keyAvailable=false,
        errorGettingKey=false;
        while (!keyAvailable && !errorGettingKey){
            let appKey = await InhouzAppCollection.findOne({
                appId
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
                appId = new mongoose.Types.ObjectId().toHexString();
            }
        }

        if(errorGettingKey){
            return res.send({
                error : {
                    message : 'An error occured while initializing the app.'
                }
            });
        }

        //add logic to initialize page and root element

        // root page
        let pageIds = [], elementIds = [];
        let rootPage = await createInitPage(
            {
                isRootPage : true,
                is404Page : false,
                routePath : '',
                appId,
                timestamp : datestamp,
                pageName : 'Index',
                appType
            },
            req
        );

        if(rootPage.error){
            return res.send({
                error : 'Failed to create app'
            });
        }

        pageIds.push(rootPage.page && rootPage.page.pageId);
        elementIds.push(rootPage.element && rootPage.element.elementId);

        if(appType === 'webApp'){
            let notFoundPage = await createInitPage(
                {
                    isRootPage : false,
                    is404Page : true,
                    routePath : '404',
                    appId,
                    timestamp : datestamp,
                    pageName : 'Not found',
                    appType
                },
                req
            );
    
            if(notFoundPage.error){
                await AppPageCollection.remove({
                    pageId : {
                        $in : pageIds
                    }
                })
                .catch(e => {
                    return {deletedCount : 0}
                });
                await AppElementCollection.remove({
                    elementId : {
                        $in : elementIds
                    }
                })
                .catch(e => {
                    return {deletedCount : 0}
                });

                return res.send({
                    error : 'Failed to create app'
                });
            }
    
            pageIds.push(notFoundPage.page && notFoundPage.page.pageId);
            elementIds.push(notFoundPage.element && notFoundPage.element.elementId);
        }

        //create app
        let newApp = await InhouzAppCollection.create({
            ...reqBody,
            companyId : req.user['companyId'],
            appId,
            createdById : req.user['_id'].toString(),
            createdDate : datestamp,
            editDate : datestamp,
            lastUpdatedById : req.user['_id'].toString(),
            activeVersionMap : {
                original : 0
            },
            elementRefTracker : {
                body : elementIds.length
            }
        })
        .catch(e => {
            return {
                error : {
                    message : 'Failed to create app'
                }
            }
        });

        if(
            !newApp ||
            (
                newApp && 
                newApp['error']
            ) ||
            (
                newApp && 
                !newApp['_id']
            )
        ){
            await AppPageCollection.remove({
                pageId : {
                    $in : pageIds
                }
            })
            .catch(e => {
                return {deletedCount : 0}
            });
            await AppElementCollection.remove({
                elementId : {
                    $in : elementIds
                }
            })
            .catch(e => {
                return {deletedCount : 0}
            });

            return res.send({
                error : {
                    message : 'Failed to create app'
                }
            });
        }

        return res.send(newApp);
    }catch(e){
        console.log('/services/appBuilder/createApp catch error', e);
        return res.status(500).send({
            error : {
                message : 'An error occured while creating app.'
            }
        })
    }
}