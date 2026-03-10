const sanitizer = require('sanitizer');
const mongoose = require('mongoose');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');
const config = require('../../config/config')();
const calculateUserAccess = require('../../utils/appBuilder/access/calculateUserAccess');
const {redisClient} = require('../../server');
const fetch = require('node-fetch');
const deleteAppStaticFiles = require('../../utils/staticFile/deleteAppStaticFiles');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {encryptedPayload=''} = reqBody;
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
            appId='', companyId='', skipUserValidation=false,
            skipStaticFileDeletion=false
        } = payload;

        if(
            !appId ||
            !companyId ||
            typeof appId !== 'string' ||
            typeof companyId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(companyId)
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid query. Required fields are missing.'
                }
            });
        }

        if(companyId !== (req.user['assetOwnerCompanyId'] || req.user['companyId'])){
            return res.status(401).send({
                error : {
                    message : 'Third party developers are not allowed to delete applications.'
                }
            });
        }

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        //get app object
        let inhouzApp = await InhouzAppCollection.findOne({
            companyId,
            appId
        })
        .lean()
        .catch(e => {
            return false
        });

        if(!inhouzApp){
            return res.status(404).send({
                error : {
                    message : 'App was not found.'
                }
            })
        }

        if(!skipUserValidation){
            let hasWriteAccess = calculateUserAccess(inhouzApp, req.user, 'writeAccess');
            if(!hasWriteAccess){
                return res.status(401).send({
                    error : {
                        message : 'Not authorized to delete app'
                    }
                })
            }
        }

        const AppElementCollection = mongoose.model(config.appElementModel);
        let elements = await AppElementCollection.find({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp getElements mongo error', e);
            return {error : true}
        });

        if(elements && elements['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while getting app elements.'
                }
            });
        }

        const AppPageCollection = mongoose.model(config.appPageModel);
        let pages = await AppPageCollection.find({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp getPages mongo error', e);
            return {error : true}
        });

        if(pages && pages['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while getting app pages.'
                }
            });
        }

        const AppBuildCollection = mongoose.model(config.appBuildModel);
        let appBuilds = await AppBuildCollection.find({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp getAppBuilds mongo error', e);
            return {error : true}
        })

        if(appBuilds && appBuilds['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while getting app builds.'
                }
            });
        }

        let AppPageBuildCollection = mongoose.model(config.appPageBuildModel);
        let appPageBuilds = await AppPageBuildCollection.find(
            {
                appId,
                companyId
            },
            {
                buildData : 0
            }
        )
        .catch(e => {
            console.log('/deleteInhouzApp get appPageBuilds mongo error', e);
            return {error : true}
        });

        if(appPageBuilds && appPageBuilds['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while getting app page build.'
                }
            });
        }

        const AppBuildReportCollection = mongoose.model(config.appBuildReportModel);
        let buildReports = await AppBuildReportCollection.find({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp getAppBuildReports mongo error', e);
            return {error : true}
        });

        if(buildReports && buildReports['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while getting app build reports.'
                }
            });
        }

        const AppDeploymentQueueCollection = mongoose.model(config.appDeploymentQueueModel);
        let queuedDeployments = await AppDeploymentQueueCollection.find({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp getQueuedDeployment mongo error', e);
            return {error : true}
        });

        if(queuedDeployments && queuedDeployments['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while getting app queued deployments.'
                }
            });
        }

        //delete elements
        let elementDeleteResponse = await AppElementCollection.deleteMany({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp deleteElements mongo error', e);
            return {error : true}
        });

        if(elementDeleteResponse['error']){
            return res.status(500).send({
                error : {
                    message : 'Failed to delete app elements.'
                }
            });
        }

        //delete pages 
        let pageDeleteResponse = await AppPageCollection.deleteMany({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp deletePages mongo error', e);
            return {error : true}
        });

        if(pageDeleteResponse['error']){
            //reinsert elements
            let strippedElements = elements.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            })
            await AppElementCollection.insertMany(strippedElements)
            .catch(e => {
                console.log('recreate elements', e);
                return {error : true}
            });
            return res.status(500).send({
                error : {
                    message : 'Failed to delete app pages.'
                }
            });
        }

        //delete builds
        let deleteBuildResponse = await AppBuildCollection.deleteMany({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp deleteBuilds catch error', e);
            return {error : true};
        });

        if(deleteBuildResponse['error']){
            //reinsert elements
            let strippedElements = elements.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedPages = pages.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            await AppElementCollection.insertMany(strippedElements)
            .catch(e => {
                console.log('recreate elements', e);
                return {error : true}
            });
            await AppPageCollection.insertMany(strippedPages)
            .catch(e => {
                console.log('recreate pages', e);
                return {error : true}
            });
            return res.status(500).send({
                error : {
                    message : 'Failed to delete app builds.'
                }
            });
        }

        //delete queued deployments
        let deleteQueuedDeploymentResponse = await AppDeploymentQueueCollection.deleteMany({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp deleteQueuedDeployment mongo error', e);
            return {error : true};
        });

        if(deleteQueuedDeploymentResponse['error']){
            //reinsert elements
            let strippedElements = elements.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedPages = pages.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedBuilds = appBuilds.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            await AppElementCollection.insertMany(strippedElements)
            .catch(e => {
                console.log('recreate elements', e);
                return {error : true}
            });
            await AppPageCollection.insertMany(strippedPages)
            .catch(e => {
                console.log('recreate pages', e);
                return {error : true}
            });
            await AppBuildCollection.insertMany(strippedBuilds)
            .catch(e => {
                console.log('recreate builds', e);
                return {error : true}
            });
            return res.status(500).send({
                error : {
                    message : 'Failed to delete app build queue.'
                }
            });
        }

        //delete inhouz app
        let deleteInhouzAppResponse = await InhouzAppCollection.deleteOne({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp deleteInhouzApp mongo error', e);
            return {error : true};
        });

        if(deleteInhouzAppResponse['error']){
            //reinsert elements
            let strippedElements = elements.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedPages = pages.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedBuilds = appBuilds.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedQueue = queuedDeployments.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            await AppElementCollection.insertMany(strippedElements)
            .catch(e => {
                console.log('recreate elements', e);
                return {error : true}
            });
            await AppPageCollection.insertMany(strippedPages)
            .catch(e => {
                console.log('recreate pages', e);
                return {error : true}
            });
            await AppBuildCollection.insertMany(strippedBuilds)
            .catch(e => {
                console.log('recreate builds', e);
                return {error : true}
            });
            await AppDeploymentQueueCollection.insertMany(strippedQueue)
            .catch(e => {
                console.log('recreate build queue', e);
                return {error : true}
            });
            return res.status(500).send({
                error : {
                    message : 'Failed to delete inhouz app.'
                }
            });
        }

        //delete build report
        let buildReportDeleteResponse = await AppBuildReportCollection.deleteMany({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp deleteBuildReport catch error', e);
            return {error : true};
        });

        if(buildReportDeleteResponse['error'] && buildReports.length > 0){
            //reinsert elements
            let strippedElements = elements.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedPages = pages.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedBuilds = appBuilds.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedQueue = queuedDeployments.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            if(inhouzApp['_id']){
                delete inhouzApp['_id'];
            }
            await AppElementCollection.insertMany(strippedElements)
            .catch(e => {
                console.log('recreate elements', e);
                return {error : true}
            });
            await AppPageCollection.insertMany(strippedPages)
            .catch(e => {
                console.log('recreate pages', e);
                return {error : true}
            });
            await AppBuildCollection.insertMany(strippedBuilds)
            .catch(e => {
                console.log('recreate builds', e);
                return {error : true}
            });
            await AppDeploymentQueueCollection.insertMany(strippedQueue)
            .catch(e => {
                console.log('recreate build queue', e);
                return {error : true}
            });
            await InhouzAppCollection.create(inhouzApp)
            .catch(e => {
                console.log('recreate inhouzApp', e);
            });
            return res.status(500).send({
                error : {
                    message : 'Failed to delete build reports.'
                }
            });
        }

        let pageBuildDeleteResponse = await AppPageBuildCollection.deleteMany({
            appId,
            companyId
        })
        .catch(e => {
            console.log('/deleteInhouzApp pageBuildDelete mongo error', e);
            return {error : true}
        });

        if(pageBuildDeleteResponse['error'] && pageBuildDeleteResponse.length > 0){
            //reinsert elements
            let strippedElements = elements.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedPages = pages.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedBuilds = appBuilds.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedQueue = queuedDeployments.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            let strippedBuildReports = buildReports.map((obj) => {
                if(obj['_id']){
                    delete obj['_id'];
                }
                return obj;
            });
            if(inhouzApp['_id']){
                delete inhouzApp['_id'];
            }
            await AppElementCollection.insertMany(strippedElements)
            .catch(e => {
                console.log('recreate elements', e);
                return {error : true}
            });
            await AppPageCollection.insertMany(strippedPages)
            .catch(e => {
                console.log('recreate pages', e);
                return {error : true}
            });
            await AppBuildCollection.insertMany(strippedBuilds)
            .catch(e => {
                console.log('recreate builds', e);
                return {error : true}
            });
            await AppDeploymentQueueCollection.insertMany(strippedQueue)
            .catch(e => {
                console.log('recreate build queue', e);
                return {error : true}
            });
            await InhouzAppCollection.create(inhouzApp)
            .catch(e => {
                console.log('recreate inhouzApp', e);
            });
            await AppBuildReportCollection.insertMany(strippedBuildReports)
            .catch(e => {
                console.log('recreate buildReports', e);
            });
            return res.status(500).send({
                error : {
                    message : 'Failed to delete build reports.'
                }
            });
        }

        //delete redis cache
        const {
            hostedExternally=false, customDomains=[],
            productionDeployedVersionMap={}, appType='',
            staticFileIdMap={}, parentAppType='',
            parentAppId
        } = inhouzApp;

        let activeCustomDomains = customDomains.filter(obj => {
            return obj['active'] === true;
        });

        const CustomDomainTerminationQueue = mongoose.model(config.customDomainTerminationQueueModel)
        //delete build report
        let domainCount = 0;
        for (let q = 0; q < activeCustomDomains.length; q++){
            let activeDomainObj = activeCustomDomains[q];
            let activeDomain = activeDomainObj['domain'];
            if(activeDomain){
                domainCount++;
                redisClient.del(`build_report_${activeDomain}`);
                //add to termination queue
                await CustomDomainTerminationQueue.create({
                    companyId,
                    cloudflareId : activeDomainObj['cloudflareId'],
                    domain : activeDomain,
                    timestamp 
                })
                .catch(e => {
                    console.log('/deleteInhouzApp customDomainTerminationQueue mongo error', e);
                    return {error : true}
                });
                if(process.env.NODE_ENV === 'production'){
                    //ping cloudflare API
                    await fetch(`${config.cloudflareApiUrl}/client/v4/zones/${config.cloudflareZoneId}/custom_hostnames/${activeDomainObj['cloudflareId']}`, {
                        method : 'DELETE',
                        headers : {
                            'Content-Type' : "application/json",
                            'X-Auth-Email' : config.cloudflareAuthEmail,
                            'X-Auth-Key' : config.cloudflareAuthKey
                        }
                    })
                    .catch(e => {
                        console.log('/deleteInhouzApp deleteCloudflareDomain catch error', e);
                        return {error : true}
                    });
                }
            }
        }
        
        for (let i = 0; i < buildReports.length; i++){
            let buildReport = buildReports[i];
            let {
                variationBuildReport=[], environment='',
                compressedAppVariationDataMapRedisKey='',
                isRedisApp=false
            } = buildReport;
            if((environment === 'production') || isRedisApp){
                for (let k = 0; k < variationBuildReport.length; k++){
                    let variationReport = variationBuildReport[k];
                    let {variationId=''} = variationReport;
                    let key = `${appId}_${variationId}_${environment}`;
                    redisClient.del(key);
                }
            }
            if(compressedAppVariationDataMapRedisKey){
                redisClient.del(compressedAppVariationDataMapRedisKey);
            }
        }

        //decrease domain count
        if(domainCount > 0){
            const InhouzSubscriptionCollection = mongoose.model(config.inhouzSubscriptionsModel);
            await InhouzSubscriptionCollection.updateOne(
                {
                    companyId,
                    active : true
                },
                {
                    $inc : {
                        customDomainCount : (domainCount * -1)
                    }
                }
            )
            .catch(e => {
                console.log('/deleteInhouzApp update customDomainCount mongo error', e);
                return {modifiedCount : 0};
            });
        }

        if(appType === 'webApp'){
            for (let q = 0; q , appPageBuilds.length; q++){
                let pageBuild = appPageBuilds[q];
                if(pageBuild['redisKey']){
                    redisClient.del(pageBuild['redisKey']);
                }
            }
        }

        if(appType === 'webComponent'){
            const WebComponentAccessTrackerCollection = mongoose.model(config.webComponentAccessTrackerModel);
            await WebComponentAccessTrackerCollection.deleteMany({
                appId,
                companyId
            })
            .catch(e => {
                console.log('/deleteInhouzApp deleteWebComponentTracker mongo error', e);
                return {deletedCount : 0};
            });

            const UserCollection = mongoose.model(config.userModel);
            await UserCollection.updateMany(
                {
                    companyId
                },
                {
                    $pull : {
                        subscribedWebComponents : {
                            appId
                        }
                    }
                }
            )
            .catch(e => {
                console.log('/deleteInhouzApp deleteUserWebcomponent mongo error', e);
                return {modifiedCount : 0};
            });
        }

        const SavedElementCollection = mongoose.model(config.savedAppElementModel);
        const SavedStyleCollection = mongoose.model(config.savedAppStylesModel);
        const StyleGuideCollection = mongoose.model(config.styleGuideModel);
        await SavedElementCollection.deleteMany({
            companyId,
            appId
        })
        .catch(e => {
            console.log('/services/appBuilder/deleteInhouzApp delete savedElement mongo error', e);
            return {deletedCount : 0}
        });
        await SavedStyleCollection.deleteMany({
            companyId,
            appId
        })
        .catch(e => {
            console.log('/services/appBuilder/deleteInhouzApp delete savedStyle mongo error', e);
            return {deletedCount : 0}
        });
        await StyleGuideCollection.deleteMany({
            companyId,
            appId
        })
        .catch(e => {
            console.log('/services/appBuilder/deleteInhouzApp delete styleGuide mongo error', e);
            return {deletedCount : 0}
        });

        if(
            typeof staticFileIdMap === 'object' &&
            (Object.keys(staticFileIdMap).length > 0) && 
            !skipStaticFileDeletion
        ){
            let docObject = {};
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
                        console.log('/deleteInhouzApp getInhouzSignTemplate mongo error', e);
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
                        console.log('/deleteInhouzApp getInhouzSignDocument mongo error', e);
                        return {error : true};
                    });
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
            }

            await deleteAppStaticFiles({
                companyId,
                staticFileIdMap,
                deleteApp : true,
                fileStorageServiceId : (docObject && docObject['draftFileStorageServiceId']) || '',
                zeroTrustAccess : true,
                isPdfGenerator : appType === 'pdfFunction'
            });
        }

        return res.send({success : true});
    }catch(e){
        console.log('/services/appBuilder/deleteInhouzApp catch block error', e);
        return res.send({
            error : {
                message : 'An error occured while deleting app.'
            }
        });
    }
}