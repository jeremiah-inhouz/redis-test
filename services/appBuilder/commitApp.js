const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const calculateUserAccess = require('../../utils/appBuilder/access/calculateUserAccess');
const {compress} = require('shrink-string');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appId='', variationId='',
            commitMessage=''
        } = reqBody;
        let companyId = req.user['companyId'], timestamp = new Date().getTime();

        if(
            !appId ||
            !variationId ||
            !companyId ||
            typeof companyId !== 'string' ||
            typeof appId !== 'string' ||
            typeof variationId !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let companyObj = await CompanyCollection.findOne({
            _id : companyId
        })
        .lean()
        .catch(e => {
            console.log('/commitApp get company mongo error', e);
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

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        let inhouzApp = await InhouzAppCollection.findOne({
            appId,
            companyId
        })
        .lean()
        .catch(e => {
            console.log('/commitApp get inhouzApp mongo error', e);
            return {error : true}
        });

        if(!inhouzApp){
            return res.status(404).send({
                error : {
                    message : 'App was not found.'
                }
            });
        }

        if(inhouzApp && inhouzApp['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while finding App.'
                }
            });
        }

        let hasWriteAccess = calculateUserAccess(inhouzApp, req.user, 'writeAccess');
        if(!hasWriteAccess){
            return res.status(401).send({
                error : {
                    message : 'Not authorized. Write access is required.'
                }
            });
        }

        const {
            activeVersionMap={}
        } = inhouzApp;
        let version = activeVersionMap[variationId];
        if(
            !version ||
            typeof version !== 'number'
        ){
            return res.status(500).send({
                error : {
                    message : 'Invalid app version.'
                }
            })
        }

        //get pages
        let AppPageCollection = mongoose.model(config.appPageModel);
        let pages = await AppPageCollection.find({
            appId,
            companyId,
            variationId : variationId || 'original',
            'versionTracker.version' : version
        }, {versionTracker : 0})
        .catch(e => {
            console.log('/commitApp getPages mongo error', e)
            return {error : true}
        });

        if(pages && pages['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while resolving app pages/views.'
                }
            });
        }

        const AppElementCollection = mongoose.model(config.appElementModel);
        let elements = await AppElementCollection.find(
            {
                appId,
                companyId,
                'versionTracker.version' : version,
                variationId : variationId || 'original'
            },
            {
                versionTracker : 0
            }
        )
        .catch(e => {
            console.log('/commitApp getElements mongo error', e)
            return {error : true}
        });

        if(elements && elements['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occured while resolving app elements.'
                }
            });
        }

        let cleanElements=[], cleanPages=[];
        for (let i = 0; i < pages.length; i++){
            let page = JSON.parse(JSON.stringify(pages[i]));
            delete page['_id'];
            cleanPages.push({
                ...page,
                versionTracker : [{
                    version
                }]
            });
        }

        for (let i = 0; i < elements.length; i++){
            let element = JSON.parse(JSON.stringify(elements[i]));
            delete element['_id'];
            cleanElements.push({
                ...element,
                versionTracker : [{
                    version
                }]
            });
        }

        let compressedAppData = await compress(JSON.stringify({
            elements : cleanElements,
            pages : cleanPages
        }));

        let InhouzAppCommitCollection = mongoose.model(config.inhouzAppCommitModel);
        let commitUpdate = await InhouzAppCommitCollection.updateOne(
            {
                appId,
                companyId,
                variationId,
                version
            },
            {
                $set : {
                    appType : inhouzApp['appType'],
                    commitMessage : commitMessage || `App Commit - ${moment().format('DD-MMM-YYYY')}`,
                    compressedAppData,
                    createdById : req.user['_id'].toString(),
                    timestamp
                }
            },
            {
                upsert : true
            }
        )
        .catch(e => {
            console.log('/commitApp create new commit mongo error', e);
            return {modifiedCount : 0}
        })

        if(
            !commitUpdate['modifiedCount'] && 
            !commitUpdate['upsertedCount']
        ){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while creating app commit.'
                }
            });
        }

        return res.send({success : true});
    }catch(e){
        console.log('/commitApp catch block error', e);
        return res.status(500).send({
            error : {
                message : 'An error occurred while commiting app version.'
            }
        });
    }
}