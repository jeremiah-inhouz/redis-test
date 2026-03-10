const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const calculateUserAccess = require('../../../utils/appBuilder/access/calculateUserAccess');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appId='', companyId=''
        } = reqBody;
        if(
            !companyId ||
            typeof companyId !== 'string' ||
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
                    message : 'External users can not save elements to the global scope.'
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

        let timestamp = new Date().getTime();
        const SaveAppElementCollection = mongoose.model(config.savedAppElementModel);
        const savedElement = await SaveAppElementCollection.create({
            ...reqBody,
            createdDate : timestamp,
            editDate : timestamp,
            lastUpdatedById : req.user['_id'],
            createdById : req.user['_id']
        })
        .catch(e => {
            console.log(e)
            return false
        });

        if(
            !savedElement ||
            (
                savedElement && 
                !savedElement['_id']
            )
        ){
            return res.send({
                error : {
                    message : 'Failed to save app element.'
                }
            });
        }else{
            return res.send({
                success : true
            });
        }
    }catch(e){
        console.log('/services/appBuilder/elements/saveAppElement catch error', e);
        return res.send({
            error : {
                message : 'Failed to save app element.'
            }
        });
    }
}