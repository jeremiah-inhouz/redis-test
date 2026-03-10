const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appName, appType=''
        } = reqBody;
        if(!appName || typeof appName !== 'string'){
            return res.send({
                results : []
            })
        }
        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        let filter = {};
        if(appType){
            filter['appType'] = appType;
        }
        const inhouzApps = await InhouzAppCollection.find(
            {
                appName : {
                    $regex : `.*${appName}.*`,
                    $options : 'i'
                },
                companyId : req.user['companyId'],
                ...filter
            },
            {
                appName : 1,
                appType : 1,
                appId : 1,
                companyId : 1,
                description : 1,
                subdomain : 1,
                folderId : 1
            }
        )
        .catch(e => {
            console.log('/services/appBuilder/getAppsByName mongo error', e);
            return {
                error : {
                    message : 'An error occured while finding apps.'
                }
            }
        });

        if(inhouzApps['error']){
            return res.status(500).send(inhouzApps);
        }

        return res.send({
            results : inhouzApps
        });
    }catch(e){
        console.log('/services/appBuilder/getAppsByName catch block error', e);
        return res.send({
            error : {
                message : 'An error occured while searching for apps.'
            }
        });
    }
}