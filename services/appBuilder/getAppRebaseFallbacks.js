const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appId='', encryptedCompanyId=''
        } = reqBody;

        if(
            !encryptedCompanyId ||
            typeof encryptedCompanyId !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        let companyId;
        let decryptedData = encryptDecrypt(encryptedCompanyId);
        if(decryptedData){
            let parsedData = JSON.parse(decryptedData);
            if(new Date().getTime() <= parsedData['expirationTimestamp']){
                companyId = parsedData['companyId'];
            }
        }

        if(
            !companyId ||
            typeof companyId !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let companyObj = await CompanyCollection.findOne({
            _id : companyId
        })
        .lean()
        .catch(e => {
            console.log('/getAppRebaseFallbacks get company mongo error', e);
            return {error : true};
        });

        if(!companyObj){
            return {
                error : {
                    message : 'Account was not found.'
                }
            }
        }

        if(companyObj && companyObj['error']){
            return {
                error : {
                    message : 'An error occurred while finding your tenant account.'
                }
            }
        }

        if(companyObj['status'] !== 'active'){
            return {
                error : {
                    message : 'Account is not active.'
                }
            }
        }

        const InhouzAppRebaseFallbackLogCollection = mongoose.model(config.inhouzAppRebaseFallbackLogModel);
        let appRebaseFallbackLogs = await InhouzAppRebaseFallbackLogCollection.find(
            {
                appId,
                companyId
            },
            {
                compressedAppData : 0
            }
        )
        .sort({
            timestamp : -1
        })
        .catch(e => {
            console.log('/getAppRebaseFallbacks get rebaseFallback mongo error', e);
            return {error : true}
        });

        if(appRebaseFallbackLogs['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while finding app fallbacks.'
                }
            });
        }

        return res.send({
            results : appRebaseFallbackLogs
        });
    }catch(e){
        console.log('/getAppRebaseFallbacks catch block error', e);
        return res.status(500).send({
            error : {
                message : 'An error occurred while finding app rebase fallbacks.'
            }
        });
    }
}