const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            savedStyleId='', appId=''
        } = reqBody;

        if(
            !savedStyleId ||
            !appId ||
            typeof savedStyleId !== 'string' ||
            typeof appId !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields are missing'
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

        const SavedStylesCollection = mongoose.model(config.savedAppStylesModel);
        const existingStyle = await SavedStylesCollection.findOne({
            _id : savedStyleId,
            companyId : existingApp['companyId']
        })
        .lean()
        .catch(e => {
            return false;
        });

        if(!existingStyle){
            return res.send({
                error : {
                    message : 'Saved style was not found'
                }
            });
        }

        if(existingApp['companyId'] !== existingStyle['companyId']){
            return res.send({
                error : {
                    message : 'Failed to create style guide'
                }
            });
        }

        const StyleGuideCollection = mongoose.model(config.styleGuideModel);
        const response = await StyleGuideCollection.create({
            ...reqBody,
            companyId : existingApp['companyId'],
            createdDate : new Date().getTime(),
            createdById : req.user['_id'],
            editDate : new Date().getTime(),
            lastUpdatedById : req.user['_id'],
        })

        if(
            !response ||
            (
                response && 
                !response['_id']
            )
        ){
            return res.send({
                error : {
                    message : 'Failed to create style guide'
                }
            })
        }else{
            res.send(response);
        }
    }catch(e){
        console.log('/services/appBuilder/styleGuide/createStyleGuide catch error', e);
        return res.send({
            error : {
                message : 'An error occured while creating style guide.'
            }
        });
    }
}