const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{    
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            styleName='', companyId='', _id=''
        } = reqBody;
        if(
            !styleName ||
            !companyId ||
            typeof styleName !== 'string' ||
            typeof companyId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(companyId)
        ){
            return res.send({available : false});
        }

        const SavedStylesCollection = mongoose.model(config.savedAppStylesModel);
        const savedStyle = await SavedStylesCollection.findOne({
            styleName,
            companyId
        })
        .lean()
        .catch(e => {
            console.log('/savedStyleNameCheck mongo error', e);
            return false;
        });

        if(
            savedStyle && 
            savedStyle['_id']
        ){
            if(
                _id && 
                (savedStyle['_id'] === _id)
            ){
                return res.send({available : true});
            }
            return res.send({available : false});
        }

        return res.send({available : true});
    }catch(e){
        console.log('/services/appBuilder/savedStyles/savedStyleNameCheck catch error', e);
        return res.send({
            error : {
                message : 'An error occured while saving styles.'
            }
        });
    }
}