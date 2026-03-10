const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');
const newPasswordEmailTemplate = require('../../../utils/email/password/newPasswordEmailTemplate');
const sendEmail = require('../../../utils/email/sendEmail/sendEmail');
const calculateUserAccess = require('../../../utils/appBuilder/access/calculateUserAccess');
const encryptDecrypt = require('../../../utils/cryptography/encryptDecrypt');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appId='', encryptedCompanyId='', environment=''
        } = reqBody;

        if(
            !appId ||
            !encryptedCompanyId ||
            !environment ||
            typeof appId !== 'string' ||
            typeof encryptedCompanyId !== 'string' ||
            typeof environment !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields are missing'
                }
            }); 
        }

        let companyId;
        let decryptedCompanyId = encryptDecrypt(encryptedCompanyId);
        if(decryptedCompanyId){
            let parsedId = JSON.parse(decryptedCompanyId);
            if(new Date().getTime() <= parsedId['expirationTimestamp']){
                companyId = parsedId['companyId'];
            }else{
                return res.send({
                    error : {
                        message : 'Invalid request. Encrypted fields are expired'
                    }
                });
            }
        }

        if(
            !companyId ||
            typeof companyId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(companyId)
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required fields are missing'
                }
            });
        }

        if(companyId !== req.user['companyId']){
            return res.send({
                error : {
                    message : 'External users can not request app password change.'
                }
            });
        }

        //get app
        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        const inhouzApp = await InhouzAppCollection.findOne({
            appId,
            companyId
        })
        .catch(e => {
            return false
        });

        if(!inhouzApp){
            return res.send({
                error : {
                    message : 'Failed to find app.'
                }
            });
        }

        let hasWriteAccess = calculateUserAccess(inhouzApp, req.user, 'writeAccess');
        if(!hasWriteAccess){
            return {
                error : {
                    message : 'Not authorized to edit app'
                }
            }
        }

        const {settings={}} = inhouzApp;
        if(!settings['passwordSet']){
            return res.send({
                error : {
                    message : 'No password has been set for this app.'
                }
            });
        }

        let newPassword = shortid.generate();
        //hash password
        let salt = await bcrypt.genSaltSync(10)
        let hash = await bcrypt.hashSync(newPassword, salt);
        let timestamp = new Date().getTime();

        const AppAccessPasswordCollection = mongoose.model(config.appAccessPasswordModel);
        let response = await AppAccessPasswordCollection.updateOne(
            {
                appId,
                companyId,
                environment
            },
            {
                $set : {
                    resetInProgress : true,
                    passwordHash : hash,
                    editDate : timestamp,
                    updatedById : req.user['_id'],
                }
            }
        )
        .catch(e => {
            console.log('app password change request mongo error', e)
            return {
                modifiedCount : 0
            }
        });

        if(response && !response['n']){
            return res.send({
                error : {
                    message : 'Failed to find existing password'
                }
            })
        }

        if(
            !response ||
            (
                response && 
                !response['modifiedCount']
            )
        ){
            return res.send({
                error : {
                    message : 'Failed to request password change.'
                }
            });
        }

        let emailTemplate = newPasswordEmailTemplate(req.user, newPassword, inhouzApp, environment);
        if(!emailTemplate){
            return res.send({
                error : {
                    message : 'Failed to send change request password. Please try again.'
                }
            });
        }

        let sendEmailResponse = sendEmail(
            req.user['email'],
            'noreply@inhouz.io',
            `${inhouzApp['appName']} - Change request passowrd`,
            '',
            emailTemplate['emailTemplate']
        );

        if(!sendEmailResponse['success']){
            return res.send({
                error : {
                    message : 'Failed to send change request password. Please try again.'
                }
            });
        }

        return res.send({success : true});
    }catch(e){
        console.log(e)
        return res.send({
            error : {
                message : 'Failed to request app password change'
            }
        });
    }
}