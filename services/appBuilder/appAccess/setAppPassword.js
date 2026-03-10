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
            environment=''
        } = reqBody;
        if(
            !password ||
            !appId ||
            !encryptedCompanyId ||
            !environment ||
            typeof password !== 'string' ||
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
            typeof companyId !== 'string'
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
                    message : 'External users can not set app password.'
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
        if(settings['passwordSet']){
            return res.send({
                error : {
                    message : 'A password has already been set for this app.'
                }
            });
        }

        //hash password
        let salt = await bcrypt.genSaltSync(10)
        let hash = await bcrypt.hashSync(password, salt);

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
                    passwordHash : hash,
                    createdDate : timestamp,
                    createdById : req.user['_id'],
                    editDate : timestamp,
                    updatedById : req.user['_id'],
                }
            },
            {
                upsert : true
            }
        )
        .catch(e => {
            return {
                modifiedCount : 0
            }
        });

        if(
            response && 
            (
                response['modifiedCount'] ||
                response['upsertedCount']
            )
        ){
            //set passwordset to true
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
        }else{
            return res.send({
                error : {
                    message : 'Failed to set app password'
                }
            })
        }
    }catch(e){
        console.log('/services/appBuilder/appAcces/setAppPassword catch error', e);
        return res.send({
            error : {
                message : 'Failed to set app password.'
            }
        });
    }
}