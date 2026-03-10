const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');
const calculateUserAccess = require('../../utils/appBuilder/access/calculateUserAccess');
const {decompress} = require('shrink-string');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appRebaseFallbackId=''
        } = reqBody;
        let companyId = req.user['companyId'], timestamp = new Date().getTime();

        if(
            !appRebaseFallbackId ||
            !companyId ||
            typeof appRebaseFallbackId !== 'string' ||
            typeof companyId !== 'string'
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
            console.log('/appRebaseFallback get company mongo error', e);
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

        const InhouzAppRebaseFallbackLogCollection = mongoose.model(config.inhouzAppRebaseFallbackLogModel);
        let appRebaseFallback = await InhouzAppRebaseFallbackLogCollection.findOne({
            _id : appRebaseFallbackId,
            companyId
        })
        .lean()
        .catch(e => {
            console.log('/appRebaseFallback get rebaseFallback mongo error', e);
            return {error : true}
        });

        if(!appRebaseFallback){
            return res.status(404).send({
                error : {
                    message : 'App rebase fallback was not found.'
                }
            });
        }

        if(appRebaseFallback['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while finding app rebase fallback.'
                }
            });
        }

        const {
            appId='', variationId='', version=0,
            compressedAppData=''
        } = appRebaseFallback;

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        let inhouzApp = await InhouzAppCollection.findOne({
            appId,
            companyId
        })
        .lean()
        .catch(e => {
            console.log('/appRebaseFallback get inhouzApp mongo error', e);
            return {error : true}
        });

        if(!inhouzApp){
            return res.status(404).send({
                error : {
                    message : 'App was not found'
                }
            });
        }

        if(inhouzApp['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while finding Inhouz App.'
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

        const AppElementCollection = mongoose.model(config.appElementModel);
        const AppPageCollection = mongoose.model(config.appPageModel);

        let pageDeleteResponse = await AppPageCollection.deleteMany({
            appId,
            companyId,
            variationId
        })
        .catch(e => {
            console.log('/appRebaseFallback getPages mongo error', e)
            return {error : true}
        });

        if(pageDeleteResponse['error']){
            return res.status(500).send({
                error : {
                    message : 'Failed to delete active pages. Try rebase again.'
                }
            });
        }

        let elementDeleteResponse = await AppElementCollection.deleteMany({
            appId,
            companyId,
            variationId
        })
        .catch(e => {
            console.log('/appRebaseFallback deleteAllElements mongo error', e)
            return {error : true}
        });

        if(elementDeleteResponse['error']){
            return res.status(500).send({
                error : {
                    message : 'Failed to delete active elements. Try rebase again.'
                }
            });
        }

        let decompressedApp = await decompress(compressedAppData);
        let parsedApp = JSON.parse(decompressedApp);
        const {
            elements=[], pages=[]
        } = parsedApp;

        let cleanElements=[], cleanPages=[];
        for (let i = 0; i < pages.length; i++){
            let page = pages[i];
            if(page['_id']){
                delete page['_id'];
            }
            cleanPages.push({
                ...page,
                companyId,
                versionTracker : [{
                    version
                }]
            });
        }

        for (let i = 0; i < elements.length; i++){
            let element = elements[i];
            if(element['_id']){
                delete element['_id'];
            }
            cleanElements.push({
                ...element,
                companyId,
                versionTracker : [{
                    version
                }]
            });
        }

        //create new pages and elements
        let newPages = await AppPageCollection.insertMany(cleanPages)
        .catch(e => {
            console.log('/appRebaseFallback create pages mongo error', e);
            return {error : true}
        });

        if(newPages['error']){
            return res.status(500).send({
                error : {
                    message : 'Failed to set rebase pages. Try rebase again.'
                }
            });
        }

        let newElements = await AppElementCollection.insertMany(cleanElements)
        .catch(e => {
            console.log('/appRebaseFallback create elements mongo error', e);
            return {error : true}
        });

        if(newElements['error']){
            return res.status(500).send({
                error : {
                    message : 'Failed to set rebase elements. Try rebase again.'
                }
            });
        }

        let variationQuery = `activeVersionMap.${variationId}`;
        //update app variation
        let appUpdate = await InhouzAppCollection.updateOne(
            {
                appId,
                companyId
            },
            {
                [variationQuery] : version,
                editDate : timestamp
            }
        )
        .catch(e => {
            console.log('/appRebaseFallback updateAppVersion mongo error', e);
            return {modifiedCount : 0}
        });

        if(!appUpdate['modifiedCount']){
            return res.status(500).send({
                error : {
                    message : 'Failed to set app variation ID. Try rebase again.'
                }
            });
        }

        InhouzAppRebaseFallbackLogCollection.deleteOne({
            _id : appRebaseFallbackId,
            companyId
        })
        .lean()
        .catch(e => {
            console.log('/appRebaseFallback delete rebaseFallback mongo error', e);
            return {deletedCount : 0}
        });

        return res.send({success : true});
    }catch(e){
        console.log('/appRebaseFallback catch block error', e);
        return res.status(500).send({
            error : {
                message : 'An error occurred while inserting app fallback.'
            }
        });
    }
}