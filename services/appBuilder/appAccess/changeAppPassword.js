const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const calculateUserAccess = require('../../../utils/appBuilder/access/calculateUserAccess');
const encryptDecrypt = require('../../../utils/cryptography/encryptDecrypt');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            password='', appId='', encryptedCompanyId='',
            changeRequestPassword='', environment=''
        } = reqBody;
        if(
            !password ||
            !appId ||
            !encryptedCompanyId ||
            !changeRequestPassword ||
            !environment ||
            typeof password !== 'string' ||
            typeof appId !== 'string' ||
            typeof encryptedCompanyId !== 'string' ||
            typeof changeRequestPassword !== 'string' ||
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
                    message : 'External users can not change app password.'
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

        //get current appPassword
        const AppAccessPasswordCollection = mongoose.model(config.appAccessPasswordModel);
        const appPassword = await AppAccessPasswordCollection.findOne({
            appId,
            companyId,
            environment
        })
        .catch(e => {
            return false;
        });

        if(!appPassword){
            return res.send({
                error : {
                    message : 'Failed to find existing password'
                }
            });
        }

        //check changeRequestPassword
        let changeRequestValid = bcrypt.compareSync(changeRequestPassword, appPassword['passwordHash']);
        if(!changeRequestValid){
            return res.send({
                error : {
                    message : 'Failed to validate change request password'
                }
            });
        }

        //hash password
        let salt = await bcrypt.genSaltSync(10)
        let hash = await bcrypt.hashSync(password, salt);

        let timestamp = new Date().getTime();
        let response = await AppAccessPasswordCollection.updateOne(
            {
                appId,
                companyId,
                environment
            },
            {
                $set : {
                    resetInProgress : false,
                    passwordHash : hash,
                    editDate : timestamp,
                    updatedById : req.user['_id'],
                }
            }
        )
        .catch(e => {
            console.log('app password change mongo error', e)
            return {
                modifiedCount : 0
            }
        });

        if(
            !response ||
            (
                response && 
                !response['modifiedCount']
            )
        ){
            return res.send({
                error : {
                    message : 'Failed to change app password.'
                }
            });
        }

        //set passwordSet to true
        await InhouzAppCollection.updateOne(
            {
                appId,
                companyId
            },
            {
                $set : {
                    'settings.passwordSet' : true,
                    'settings.passwordSetDate' : timestamp,
                    'settings.passwordSetById' : req.user['_id'],
                }
            }
        )
        .catch(e => {
            return {
                error : {
                    message : 'Failed to mark password as set'
                }
            }
        })

        return res.send({
            success : true
        });
    }catch(e){
        console.log('/services/appBuilder/appAccess/changeAppPassword catch error', e);
        return res.send({
            error : {
                message : 'Failed to change app password'
            }
        });
    }
}