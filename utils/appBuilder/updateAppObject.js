const mongoose = require('mongoose');
const config = require('../../config/config')();

module.exports = async (update={}, appId='', companyId='', escape=false) => {
    try{
        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);

        //data cleanup
        if(update['activeVersion']){
            delete update['activeVersion'];
        }
        if(update['deployedVersion']){
            delete update['deployedVersion'];
        }
        if(update['createdDate']){
            delete update['createdDate'];
        }
        if(Object.keys(update).includes('transactionInProgress') && !escape){
            delete update['transactionInProgress'];
        }
        if(update['appId']){
            delete update['appId'];
        }
        if(update['companyId']){
            delete update['companyId'];
        }
        if(update['appType']){
            delete update['appType'];
        }
        if(update['createdById']){
            delete update['createdById'];
        }
        if(update['deployed']){
            delete update['deployed'];
        }
        if(update['activeVersionMap'] && !escape){
            delete update['activeVersionMap'];
        }
        if(update['deployedVersionMap']){
            delete update['deployedVersionMap'];
        }
        if(update['_id']){
            delete update['_id'];
        }

        let updateResponse = await InhouzAppCollection.updateOne(
            {
                appId,
                companyId
            },
            {
                $set : {
                    ...update,
                    editDate : new Date().getTime(),
                    rebased : false
                }
            }
        )
        .catch(e => {
            console.log('/updateAppObject appUpdate mongo error', e);
            return {modifiedCount : 0}
        });

        if(!updateResponse['modifiedCount']){
            return {
                error : {
                    message : 'App update failed.',
                    errorPayload : 'Failed to update app object'
                }
            };
        }

        return {success : true};
    }catch(e){
        console.log('/utils/appBuilder/updateAppObject catch error', e);
        return {
            error : {
                message : 'App update failed.',
                errorPayload : 'UpdateAppObject catch block error'
            }
        }
    }
}