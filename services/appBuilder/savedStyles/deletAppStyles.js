const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.params, sanitizer);
        const {
            appId='', styleId=''
        } = reqBody;
        if(
            !appId ||
            !styleId ||
            typeof appId !== 'string' ||
            typeof styleId !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required parameters are missing.'
                }
            });
        }

        const SavedStylesCollection = mongoose.model(config.savedAppStylesModel);
        const response = await SavedStylesCollection.remove({
            appId,
            _id : styleId,
            companyId : req.user['companyId']
        })
        .catch(e => {
            console.log('/services/appBuilder/savedStyles/saveStyle mongo error', e);
            return {deletedCount : 0};
        });

        if(response['deletedCount']){
            return res.send({
                error : {
                    message : 'Failed to delete element styles'
                }
            });
        }else{
            return res.send({success : true});
        }
    }catch(e){
        console.log('/services/appBuilder/savedStyles/deleteAppStyles catch error', e);
        return res.send({
            error : {
                message : 'An error occured while deleting app styles.'
            }
        });
    }
}