const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {value='', appId='', field=''} = reqBody;
        if(
            !value ||
            !field ||
            typeof field !== 'string' ||
            typeof value !== 'string'
        ){
            return res.send({available : false});
        }
        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        //check if name exists
        let nameExists = await InhouzAppCollection.findOne({
            [field] : value,
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
                    message : 'Failed to validate field value availability.'
                }
            });
        }

        if(
            nameExists && 
            nameExists['appId']
        ){
            if(
                appId && 
                (nameExists['appId'] === appId)
            ){
                return res.send({available : true});
            }
            return res.send({available : false});
        }

        return res.send({available : true});
    }catch(e){
        console.log('/services/appBuilder/appFolder/appFieldAvailability catch error', e);
        return res.send({
            error : {
                message : 'An error occured while validating folder name.'
            }
        })
    }
}