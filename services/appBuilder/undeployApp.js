const sanitizer = require('sanitizer');
const mongoose = require('mongoose');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');
const config = require('../../config/config')();
const calculateUserAccess = require('../../utils/appBuilder/access/calculateUserAccess');
const {redisClient} = require('../../server');
const postRequest = require('../../utils/requests/postRequest');
const Cryptr = require('cryptr');
const moment = require('moment');

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
        let cryptr = new Cryptr(config.sessionSecret);
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
            appId='', variationId='', environment=''
        } = payload;
        let companyId = req.user['companyId'];

        if(
            !appId ||
            !variationId ||
            !environment ||
            !companyId ||
            typeof appId !== 'string' ||
            typeof variationId !== 'string' ||
            typeof environment !== 'string' ||
            typeof companyId !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid query. Required fields are missing.'
                }
            });
        }
        let isProd = environment.toLowerCase() === 'production' ? true : false;

        if(
            isProd && 
            (companyId !== (req.user['assetOwnerCompanyId'] || req.user['companyId']))
        ){
            return res.status(401).send({
                error : {
                    message : 'Third party developers are not allowed to undeploy production applications.'
                }
            });
        }

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        let inhouzApp = await InhouzAppCollection.findOne({
            companyId,
            appId
        })
        .lean()
        .catch(e => {
            console.log('/undeployApp get inhouzApp mongo error', e);
            return {error : true}
        });

        if(!inhouzApp){
            return res.status(404).send({
                error : {
                    message : 'App was not found.'
                }
            })
        }

        if(inhouzApp['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while finding app.'
                }
            });
        }

        let hasWriteAccess = calculateUserAccess(inhouzApp, req.user, 'writeAccess');
        if(!hasWriteAccess){
            return res.status(401).send({
                error : {
                    message : 'Not authorized to delete app'
                }
            })
        }

        const {
            hostedExternally=false, customDomains=[], appType=''
        } = inhouzApp;

        if(
            (environment === 'production') && 
            config.commitAppTypes.includes(inhouzApp['appType'])
        ){
            if(!req.user.permissions.includes(config.appProductionDeploymentPermission)){
                return res.status(403).send({
                    error : {
                        message : 'You do not have the permission to undeploy production environment apps.'
                    }
                });
            }
        }

        const AppBuildCollection = mongoose.model(config.appBuildModel);
        const AppBuildReportCollection = mongoose.model(config.appBuildReportModel);

        //delete build
        let key = `${appId}_${variationId}_${environment}`;
        redisClient.del(key);

        //delete app data cache
        let appDataCacheKey = `${appId}_original_${environment}_buildreport_appdatacache`;
        redisClient.del(appDataCacheKey);

        if(hostedExternally && isProd){
            //delete redis cache
            for (let i = 0; i < customDomains.length; i++){
                let customDomainObj = customDomains[i];
                const {
                    active=false, cloudflareId=''
                } = customDomainObj;

                if(active && cloudflareId && customDomainObj['domain']){
                    let encrPayload = cryptr.encrypt(JSON.stringify({
                        payload : {
                            appId,
                            companyId,
                            cloudflareId,
                            deleteDomain : true
                        },
                        expirationTimestamp : moment(60, 'seconds').unix() * 1000
                    }))
                    postRequest(
                        `${config.appBuilderMsUrl}/api/appbuilder/deactivatecustomdomain`,
                        {
                            Cookie : req.headers.cookie,
                            'x-csrfToken' : req.header('x-csrfToken') || '',
                            'x-access-token' : req.header('x-access-token') || ''
                        },
                        {
                            encryptedPayload : encrPayload,
                            serverEncrypted : true
                        }
                    );
                }
            }
            
        }

        //delete app build
        let deleteAppBuildRes = await AppBuildCollection.deleteOne({
            appId,
            companyId,
            variationId,
            environment
        })
        .catch(e => {
            console.log('/undeployApp delete appBuild mongo error', e);
            return {deletedCount : 0}
        });

        if(!deleteAppBuildRes['deletedCount']){
            return res.status(500).send({
                error : {
                    message : 'Failed to delete app build'
                }
            });
        }

        //delete variation report
        AppBuildReportCollection.updateOne(
            {
                companyId,
                appId,
                environment
            },
            {
                $pull : {
                    variationBuildReport : {
                        variationId
                    }
                }
            }
        )
        .catch(e => {
            console.log('/undeployApp update buildReport mongo error', e);
            return {modifiedCount : 0}
        });

        //update inhouz app
        let deployedVersionMap = inhouzApp[`${environment}DeployedVersionMap`];
        if(deployedVersionMap){
            if(deployedVersionMap[variationId]){
                delete deployedVersionMap[variationId];
            }

            await InhouzAppCollection.updateOne(
                {
                    companyId,
                    appId
                },
                {
                    $set : {
                        [`${environment}DeployedVersionMap`] : deployedVersionMap
                    }
                }
            )
            .catch(e => {
                console.log('/undeployApp updateApp mongo error', e);
                return {error : e}
            });
        }

        if(appType === 'webApp'){
            let AppPageBuildCollection = mongoose.model(config.appPageBuildModel);
            let appPageBuilds = await AppPageBuildCollection.find(
                {
                    companyId,
                    appId,
                    environment,
                    variationId
                },
                {
                    buildData : 0
                }
            )
            .catch(e => {
                console.log('/undeployApp get appPageBuilds mongo error', e);
                return {error : true}
            });

            if(Array.isArray(appPageBuilds)){
                for (let i = 0; i < appPageBuilds.length; i++){
                    let appPageBuild = appPageBuilds[i];
                    const {
                        redisKey=''
                    } = appPageBuild;

                    if(redisKey){
                        redisClient.del(redisKey);
                    }

                    AppPageBuildCollection.deleteOne({
                        _id : appPageBuild['_id'].toString(),
                        companyId
                    })
                    .catch(e => {
                        console.log('/undeployApp deletePageBuild mongo error', e);
                        return {deletedCount : 0};
                    });
                }
            }
        }

        return res.send({success : true});
    }catch(e){
        console.log('/services/appBuilder/undeployApp catch block error', e);
        return res.send({
            error : {
                message : 'An error occured while undeploying app.'
            }
        });
    }
}