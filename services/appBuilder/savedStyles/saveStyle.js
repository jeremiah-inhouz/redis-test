const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            styleName='', appId='', styleArray=[]
        } = reqBody;
        if(
            !styleName ||
            !appId ||
            typeof styleName !== 'string' ||
            typeof appId !== 'string' ||
            !Array.isArray(styleArray) ||
            (
                Array.isArray(styleArray) && 
                styleArray.length === 0
            )
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
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
        const savedStyle = await SavedStylesCollection.create({
            ...reqBody,
            companyId : existingApp['companyId'],
            createdDate : new Date().getTime(),
            createdById : req.user['_id'],
            editDate : new Date().getTime(),
            lastUpdatedById : req.user['_id']
        })
        .catch(e => {
            console.log('/services/appBuilder/savedStyles/saveStyle mongo error', e);
            return false;
        });

        if(!savedStyle){
            return res.send({
                error : {
                    message : 'Failed to save element styles.'
                }
            });
        }else{
            return res.send(savedStyle);
        }
    }catch(e){
        console.log('/services/appBuilder/savedStyles/saveStyle catch error', e);
        return res.send({
            error : {
                message : 'An error occured while saving styles.'
            }
        });
    }
}