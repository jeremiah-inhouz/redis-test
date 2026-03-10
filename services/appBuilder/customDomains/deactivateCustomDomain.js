const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const encryptDecrypt = require('../../../utils/cryptography/encryptDecrypt');
const {redisClient} = require('../../../server');
const fetch = require('node-fetch');
const Cryptr = require('cryptr');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {encryptedPayload='', serverEncrypted=false} = reqBody;
        if(
            !encryptedPayload ||
            typeof encryptedPayload !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        let payload, decryptedPayload, timestamp = new Date().getTime();
        let cryptr = new Cryptr(config.sessionSecret);
        if(serverEncrypted){
            decryptedPayload = cryptr.decrypt(encryptedPayload);
        }else{
            decryptedPayload = encryptDecrypt(encryptedPayload);
        }
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
            appId='', companyId='', cloudflareId='',
            deleteDomain=false
        } = payload;

        if(
            !appId ||
            !companyId ||
            !cloudflareId ||
            !mongoose.Types.ObjectId.isValid(appId) ||
            !mongoose.Types.ObjectId.isValid(companyId) ||
            typeof cloudflareId !== 'string' ||
            process.env.NODE_ENV !== 'production'
        ){
            return res.send({
                error : {
                    message : 'Invalid query. Required fields are missing.'
                }
            });
        }

        if(companyId !== req.user['companyId']){
            return res.status(401).send({
                error : {
                    message : 'Third party developers are not allowed to activate or deactivate custom domains.'
                }
            });
        }

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        let inhouzApp = await InhouzAppCollection.findOne({
            companyId,
            appId,
            appType : 'webApp'
        })
        .catch(e => {
            console.log('/deactivateCustomDomain get inhouzApp mongo error', e);
            return {error : true};
        });

        if(!inhouzApp){
            return res.status(404).send({
                error : {
                    message : 'App was not found.'
                }
            });
        }

        if(inhouzApp['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while finding app.'
                }
            });
        }

        const {
            customDomains=[]
        } = inhouzApp;

        let customDomainObj;
        for (let i = 0; i < customDomains.length; i++){
            let domainObj = customDomains[i];
            if(domainObj['cloudflareId'] === cloudflareId){
                customDomainObj = domainObj;
                break;
            }
        }

        if(!customDomainObj){
            return res.status(400).send({
                error : {
                    message : 'Custom domain is not attached to app.'
                }
            });
        }

        const {domain=''} = customDomainObj;
        //delete custom domain cloudflare integration 
        let deleteResponse = await fetch(`${config.cloudflareApiUrl}/client/v4/zones/${config.cloudflareZoneId}/custom_hostnames/${cloudflareId}`, {
            method : 'DELETE',
            headers : {
                'Content-Type' : "application/json",
                'X-Auth-Email' : config.cloudflareAuthEmail,
                'X-Auth-Key' : config.cloudflareAuthKey
            }
        })
        .then(res => {
            return res.json();
        })
        .catch(e => {
            console.log('/deactivateCustomDomain deleteCloudflareDomain catch error', e);
            return {error : true}
        });

        if(!deleteResponse['success']){
            return res.send({
                error : {
                    message : 'Failed to deactivate custom hostname and SSL certificates.'
                }
            });
        }

        //update inhouzSubscription
        const InhouzSubscriptionCollection = mongoose.model(config.inhouzSubscriptionsModel);
        await InhouzSubscriptionCollection.updateOne(
            {
                companyId
            },
            {
                $inc : {
                    customDomainCount : -1
                }
            }
        )
        .catch(e => {
            console.log('/deactivateCustomDomain customDomainCount mongo error', e);
            return {modifiedCount : true}
        });

        //undeploy from redis
        const AppBuildReportCollection = mongoose.model(config.appBuildReportModel);
        const AppBuildCollection = mongoose.model(config.appBuildModel);
        let appBuildReport = await AppBuildReportCollection.findOne({
            appId,
            companyId,
            environment : 'production'
        })
        .catch(e => {
            console.log('/deactivateCustomDomain get appBuildReport mongo error', e);
            return {error : true}
        });

        if(appBuildReport && appBuildReport['_id']){
            let reportId = `build_report_${domain}`;
            redisClient.del(reportId);
            const {variationBuildReport=[]} = appBuildReport;
            for (let i = 0; i < variationBuildReport.length; i++){
                let variationObj = variationBuildReport[i];
                let build = await AppBuildCollection.findOne({
                    companyId,
                    appId,
                    environment : 'production',
                    variationId : variationObj['variationId']
                })
                .catch(e => {
                    return false;
                });

                if(build){
                    let buildId = `${appId}_${variationObj['variationId']}_production`;
                    redisClient.del(buildId);
                }
            }

            if(!appBuildReport['customDomains'].map(obj => obj['domain']).includes(domain)){
                await AppBuildReportCollection.updateOne(
                    {
                        appId,
                        companyId,
                        environment : 'production'
                    },
                    {
                        $pull : {
                            customDomains : {
                                domain
                            }
                        }
                    }
                )
                .catch(e => {
                    console.log('/deactivateCustomDomain updateReport mongo error', e);
                    return {modifiedCount : 0}
                });
            }
        }

        //update list of domains
        let updatedList = [
            ...customDomains.filter(obj => {
                return obj['domain'] !== domain
            })
        ];

        if(!deleteDomain){
            updatedList.push({
                _id : customDomainObj['_id'] || new mongoose.Types.ObjectId().toString(),
                domain,
                active : false,
                cloudflareId : '',
                activationDate : timestamp
            });
        }

        await InhouzAppCollection.updateOne(
            {
                appId,
                companyId
            },
            {
                $set : {
                    customDomains : updatedList
                }
            }
        )
        .catch(e => {
            console.log('/deactivateCustomDomain update customDomainList mongo error', e);
            return {modifiedCount : true}
        });

        return res.send({success : true});
    }catch(e){
        console.log('/services/appBuilder/customDomains/deactivateCustomDomain catch error', e);
        return res.send({
            error : {
                message : 'Failed to activate custom domain'
            }
        });
    }
}