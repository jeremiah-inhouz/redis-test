const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            logs=[]
        } = reqBody;
        let hasAccess = true;
        for (let i = 0; i < logs.length; i++){
            let log = logs[i];
            if(
                log['companyId'] !== req.user['companyId']
            ){
                hasAccess = false;
                break;
            }
        }

        if(!hasAccess){
            return res.send({
                error : {
                    message : 'External users can not grant access to other external users'
                }
            });
        }

        const ExternalUserAccessLogCollection = mongoose.model(config.externalUserEditorAccessLogModel);
        const response = await ExternalUserAccessLogCollection.create(logs)
        .catch(e => {
            console.log('logExternalUserEditorAccess mongo error', e);
            return {
                error : {
                    message : 'Failed to log editor access update'
                }
            }
        });
        return res.send(response);
    }catch(e){
        console.log('/services/appBuilder/logExternalUserEditorAccess catch error', e);
        return res.send({
            error : {
                message : 'Failed to log editor access update'
            }
        })
    }
}