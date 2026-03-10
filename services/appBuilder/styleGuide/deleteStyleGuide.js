const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.params, sanitizer);
        const {
            appId='', styleGuideId=''
        } = reqBody;
        if(
            !appId ||
            !styleGuideId ||
            typeof appId !== 'string' ||
            typeof styleGuideId !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required parameters are missing.'
                }
            });
        }

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        const existingApp = await InhouzAppCollection.findOne({
            appId
        })
        .lean()
        .catch(e => {
            return false;
        });

        if(!existingApp){
            return res.send({
                error : {
                    message : 'App was not found.'
                }
            });
        }

        const StyleGuideCollection = mongoose.model(config.styleGuideModel);
        const response = await StyleGuideCollection.remove({
            _id : styleGuideId,
            appId,
            companyId : existingApp['companyId']
        })
        .catch(e => {
            console.log('deleteStyleGuide mongo catch error', e);
            return {deletedCount : 0}
        });

        if(
            !response ||
            (
                response && 
                !response['deletedCount']
            )
        ){
            return res.send({success : false});
        }else{
            return res.send({success : true});
        }
    }catch(e){
        console.log('/services/appBuilder/styleGuide/deleteStyleGuide catch error', e);
        return res.send({
            error : {
                message : 'An error occured while deleting style guide.'
            }
        });
    }
}