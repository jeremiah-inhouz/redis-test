const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {folderName='', _id} = reqBody;
        if(
            !folderName ||
            typeof folderName !== 'string'
        ){
            return res.send({available : false});
        }
        if(folderName.toLowerCase() === 'general'){
            return res.send({available : false});
        }
        const AppFolderCollection = mongoose.model(config.appFolderModel);
        //check if name exists
        let nameExists = await AppFolderCollection.findOne({
            folderName,
            companyId : req.user['companyId']
        })
        .lean()
        .catch(e => {
            return {error : true}
        });
        if(
            nameExists && 
            nameExists['error']
        ){
            return res.send({
                error : {
                    message : 'Failed to validate folder name.'
                }
            });
        }

        if(
            nameExists && 
            nameExists['_id']
        ){
            if(
                _id && 
                (nameExists['_id'].toString() === _id)
            ){
                return res.send({available : true});
            }
            return res.send({available : false});
        }

        return res.send({available : true});
    }catch(e){
        console.log('/services/appBuilder/appFolder/folderNameAvailability catch error', e);
        return res.send({
            error : {
                message : 'An error occured while validating folder name.'
            }
        })
    }
}