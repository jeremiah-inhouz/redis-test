const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            idType='', companyId=''
        } = reqBody;
        if(
            !idType ||
            !companyId ||
            typeof idType !== 'string' ||
            typeof companyId !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields such as idType and companyId are missing.'
                }
            });
        }

        const AppPageCollection = mongoose.model(config.appPageModel);
        const AppElementCollection = mongoose.model(config.appElementModel);
        let id = new mongoose.Types.ObjectId().toHexString(), keyAvailable=false,
        errorGettingKey=false;

        while (!keyAvailable && !errorGettingKey){
            let document = idType === 'element' ?
            await AppElementCollection.findOne({
                companyId,
                elementId : id
            })
            .catch(e => {
                return {
                    error : {
                        message : 'An error occured while finding element',
                        errorPayload : e
                    }
                }
            }) 
            :
            await AppPageCollection.findOne({
                companyId,
                pageId : id
            })
            .catch(e => {
                return {
                    error : {
                        message : 'An error occured while finding page',
                        errorPayload : e
                    }
                }
            });

            if(
                document && 
                document['error']
            ){
                errorGettingKey = true;
            }

            if(!document || _.isEmpty(document)){
                keyAvailable = true;
            }

            if(document && document['_id']){
                id = new mongoose.Types.ObjectId().toHexString();
            }
        }

        if(errorGettingKey){
            return res.send({
                error : {
                    message : 'An error occured while generating a unique id'
                }
            });
        }

        return res.send({
            id
        });
    }catch(e){
        console.log('/services/appBuilder/getUniqueId catch error', e);
        return res.send({
            error : {
                message : 'An error occured while generating a unique id'
            }
        });
    }
}