const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const encryptDecrypt = require('../../../utils/cryptography/encryptDecrypt');
const {redisClient} = require('../../../server');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {encryptedPayload=''} = reqBody;
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
            appId='', companyId='', domainString=''
        } = payload;

        if(
            !appId ||
            !companyId ||
            !domainString ||
            !mongoose.Types.ObjectId.isValid(appId) ||
            !mongoose.Types.ObjectId.isValid(companyId) ||
            typeof domainString !== 'string' ||
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

        let domain = domainString.toLowerCase();

        const InhouzSubscriptionCollection = mongoose.model(config.inhouzSubscriptionsModel);
        const inhouzSubscription = await InhouzSubscriptionCollection.findOne({
            companyId,
            active : true
        })
        .catch(e => {
            console.log('/activateCustomDomain get inhouzSubscription mongo error', e);
            return {error : true};
        });

        if(!inhouzSubscription){
            return res.status(404).send({
                error : {
                    message : 'Account license was not found.'
                }
            });
        }

        if(inhouzSubscription['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while validating license.'
                }
            });
        }

        if(inhouzSubscription['inSubscriptionTrial']){
            return res.status(403).send({
                error : {
                    message : 'Custom domains can not be activated in the trial period.'
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
            console.log('/activateCustomDomain get inhouzApp mongo error', e);
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
            productionDeployedVersionMap={}, customDomains=[]
        } = inhouzApp;

        if(Object.keys(productionDeployedVersionMap).length === 0){
            return res.status(400).send({
                error : {
                    message : 'Custom domains can only be activated for apps deployed to the production environment.'
                }
            });
        }

        let customDomainObj;
        let activeDomains = await customDomains.filter(obj => {
            return obj['active'] === true;
        });

        if(activeDomains.length > 1){
            return res.send({
                error : {
                    message : 'There is a maximum of 2 custom domains per app.'
                }
            });
        }

        for (let i = 0; i < customDomains.length; i++){
            let domainObj = customDomains[i];
            if(domainObj['domain'] === domain){
                customDomainObj = domainObj;
                break;
            }
        }

        if(!customDomainObj){
            return res.status(404).send({
                error : {
                    message : 'Custom domain is not attached to app.'
                }
            })
        }

        const {
            active='', cloudflareId=''
        } = customDomainObj;

        if(active && cloudflareId){
            //get cloudflare details
            let existingHostname = await fetch(`${config.cloudflareApiUrl}/client/v4/zones/${config.cloudflareZoneId}/custom_hostnames/${cloudflareId}`, {
                method : 'GET',
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
                console.log('/deleteInhouzApp deleteCloudflareDomain catch error', e);
                return {error : true}
            });

            if(existingHostname['error'] || !existingHostname['success']){
                return res.send({
                    error : {
                        message : 'An error occured while validating existing custom domain.'
                    }
                });
            }

            const {result={}} = existingHostname;
            if(result['hostname']){
                if(result['hostname'] === domain){
                    return res.send({
                        error : {
                            message : 'Custom domain is already active. Check your DNS settings.'
                        }
                    });
                }else{
                    return res.send({
                        error : {
                            message : 'An existing hostname exists for this custom domains identifier (ID). Please delete the custom domain object and retry.'
                        }
                    });
                }
            }else{
                return res.send({
                    error : {
                        message : 'Custom domain is corrupted. Please delete custom domain object and retry.'
                    }
                });
            }
        }

        let hostnameResponse = await fetch(`${config.cloudflareApiUrl}/client/v4/zones/${config.cloudflareZoneId}/custom_hostnames`, {
            method : 'POST',
            headers : {
                'Content-Type' : "application/json",
                'X-Auth-Email' : config.cloudflareAuthEmail,
                'X-Auth-Key' : config.cloudflareAuthKey
            },
            body : JSON.stringify({
                hostname : domain,
                ssl : {
                    "method": "http",
                    "type": "dv",
                    "settings": {
                      "http2": "on",
                      "http3": "on",
                      "min_tls_version": "1.2",
                      "tls_1_3": "on",
                      "ciphers": [
                        "ECDHE-RSA-AES128-GCM-SHA256",
                        "AES128-SHA"
                      ],
                      "early_hints": "on"
                    },
                    "bundle_method": "ubiquitous",
                    "wildcard": false,
                }
            })
        })
        .then(res => {
            return res.json();
        })
        .catch(e => {
            console.log('/deleteInhouzApp deleteCloudflareDomain catch error', e);
            return {error : true}
        });

        if(hostnameResponse['error'] || !hostnameResponse['success']){
            return res.send({
                error : {
                    message : 'An error occured while configuring custom domain. Check DNS settings and try again.',
                    errorPayload : hostnameResponse['errors']
                }
            });
        }

        const {
            result={}
        } = hostnameResponse;
        const {
            id=''
        } = result;

        if(!id){
            console.log('/activateCustomDomain missing cloudflare id', hostnameResponse);
            return res.send({
                error : {
                    message : 'An error occured while configuring custom domain. Check DNS settings and try again.',
                    errorPayload : hostnameResponse
                }
            });
        }

        //update list of domains
        let updatedList = [
            ...customDomains.filter(obj => {
                return obj['domain'] !== domain
            }),
            {
                _id : customDomainObj['_id'] || new mongoose.Types.ObjectId().toString(),
                domain,
                active : true,
                cloudflareId : id,
                activationDate : timestamp
            }
        ];

        let updateResponse = await InhouzAppCollection.updateOne(
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
            console.log('/activateCustomDomain update customDomainList mongo error', e);
            return {modifiedCount : true}
        });

        if(!updateResponse['modifiedCount']){
            //deactivate custom domain
            await fetch(`${config.cloudflareApiUrl}/client/v4/zones/${config.cloudflareZoneId}/custom_hostnames/${id}`, {
                method : 'DELETE',
                headers : {
                    'Content-Type' : "application/json",
                    'X-Auth-Email' : config.cloudflareAuthEmail,
                    'X-Auth-Key' : config.cloudflareAuthKey
                }
            })
            .catch(e => {
                console.log('/activateCustomDomain deleteCloudflareDomain catch error', e);
                return {error : true}
            });

            return res.send({
                error : {
                    message : 'An error occured while activating custom domain'
                }
            });
        }

        //update inhouzSubscription
        await InhouzSubscriptionCollection.updateOne(
            {
                companyId,
                active : true
            },
            {
                $inc : {
                    customDomainCount : 1
                }
            }
        )
        .catch(e => {
            console.log('/activateCustomDomain customDomainCount mongo error', e);
            return {modifiedCount : true}
        });

        //deploy to redis
        const AppBuildReportCollection = mongoose.model(config.appBuildReportModel);
        const AppBuildCollection = mongoose.model(config.appBuildModel);
        let appBuildReport = await AppBuildReportCollection.findOne({
            appId,
            companyId,
            environment : 'production'
        })
        .catch(e => {
            console.log('/activateCustomDomain get appBuildReport mongo error', e);
            return {error : true}
        });

        if(appBuildReport && appBuildReport['_id']){
            let reportId = `build_report_${domain}`;
            redisClient.set(reportId, JSON.stringify(appBuildReport));
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
                    let {buildData=''} = build;
                    let buildId = `${appId}_${variationObj['variationId']}_production`;
                    redisClient.set(buildId, buildData);
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
                        $push : {
                            customDomains : {
                                domain
                            }
                        }
                    }
                )
                .catch(e => {
                    console.log('/activateCustomDomain updateReport mongo error', e);
                    return {modifiedCount : 0}
                });
            }
        }

        return res.send({
            success : true,
            cloudflareId : id
        });
    }catch(e){
        console.log('/services/appBuilder/customDomains/activateCustomDomain catch error', e);
        return res.send({
            error : {
                message : 'Failed to activate custom domain'
            }
        });
    }
}