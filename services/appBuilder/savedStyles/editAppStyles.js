const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            styleName='', appId='', styleArray=[], _id=''
        } = reqBody;
        if(
            !styleName ||
            !appId ||
            !_id ||
            typeof styleName !== 'string' ||
            typeof appId !== 'string' ||
            typeof _id !== 'string' ||
            !Array.isArray(styleArray) ||
            (
                Array.isArray(styleArray) && 
                styleArray.length === 0
            )
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required field are missing'
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
        const response = await SavedStylesCollection.updateOne(
            {
                _id,
                appId,
                companyId : existingApp['companyId']
            },
            {
                ...reqBody,
                companyId : existingApp['companyId'],
                editDate : new Date().getTime(),
                lastUpdatedById : req.user['_id']
            }
        )
        .catch(e => {
            console.log('/services/appBuilder/savedStyles/editStyle mongo error', e);
            return {modifiedCount : 0};
        });

        if(!response['modifiedCount']){
            return res.send({
                error : {
                    message : 'Failed to update element styles'
                }
            });
        }else{
            return res.send({success : true});
        }
    }catch(e){
        console.log('/services/appBuilder/savedStyles/editStyle catch error', e);
        return res.send({
            error : {
                message : 'An error occured while editing styles.'
            }
        });
    }
}