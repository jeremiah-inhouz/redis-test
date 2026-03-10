const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const calculateUserAccess = require('../../../utils/appBuilder/access/calculateUserAccess');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appId='', companyId='', _id=''
        } = reqBody;
        if(
            !_id ||
            !companyId ||
            typeof companyId !== 'string' ||
            typeof _id !== 'string' ||
            !mongoose.Types.ObjectId.isValid(companyId)
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            })
        }

        if(companyId !== req.user['companyId']){
            return res.send({
                error : {
                    message : 'External users can not delete elements in the global scope.'
                }
            });
        }

        if(
            companyId && 
            (
                appId && 
                typeof appId === 'string'
            )
        ){
            const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
            //get app object
            const inhouzApp = await InhouzAppCollection.findOne({
                companyId,
                appId
            })
            .lean()
            .catch(e => {
                return false
            });

            if(!inhouzApp){
                return {
                    error : {
                        message : 'App was not found.'
                    }
                }
            }

            let hasAccess = calculateUserAccess(inhouzApp, req.user, 'writeAccess');
            if(!hasAccess){
                return res.send({
                    error : {
                        message : 'Not authorized to edit app.'
                    }
                });
            }
        }

        const SaveAppElementCollection = mongoose.model(config.savedAppElementModel);
        const deleteResponse = await SaveAppElementCollection.deleteOne({
            _id,
            companyId
        })
        .catch(e => {
            return {deletedCount : 0}
        });

        if(
            !deleteResponse ||
            (
                deleteResponse && 
                !deleteResponse['deletedCount']
            )
        ){
            return res.send({
                error : {
                    message : 'Failed to delete app element.'
                }
            });
        }else{
            return res.send({success : true});
        }
    }catch(e){
        console.log('/services/appBuilder/elements/deleteSavedAppElement catch error', e);
        return res.send({
            error : {
                message : 'Failed to delete app element.'
            }
        });
    }
}