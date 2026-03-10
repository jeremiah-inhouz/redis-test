const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            savedStyleId='', appId='', _id='', elementType=''
        } = reqBody;

        if(
            !_id ||
            !savedStyleId ||
            !appId ||
            !elementType ||
            typeof savedStyleId !== 'string' ||
            typeof appId !== 'string' ||
            typeof _id !== 'string' ||
            typeof elementType !== 'string'
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
            _id : savedStyleId
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
        const response = await StyleGuideCollection.updateOne(
            {
                _id,
                companyId : existingApp['companyId'],
                elementType
            },
            {
                ...reqBody,
                companyId : existingApp['companyId'],
                editDate : new Date().getTime(),
                lastUpdatedById : req.user['_id']
            }
        )
        .catch(e => {
            return {modifiedCount : 0}
        })

        if(
            !response ||
            (
                response && 
                !response['modifiedCount']
            )
        ){
            return res.send({
                error : {
                    message : 'Failed to update style guide'
                }
            })
        }else{
            res.send({success : true});
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