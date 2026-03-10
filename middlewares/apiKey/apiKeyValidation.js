const config = require('../../config/config')();
const Cryptr = require('cryptr');
const getSystemUser = require('../../utils/systemUser/getSystemUser');
const getSubscriptionUser = require('../../utils/subscriptionUser/getSubscriptionUser');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');
const validateQueryKey = require('../../utils/query/validateQueryKey');

module.exports = async (req, res, next) => {
    try{
        if(req.isServerAuthorized){
            return next();
        }
        let encryptedApiKey = req.header('X-SE-API-KEY') || req.header('X-CE-API-KEY');
        if(!encryptedApiKey){
            return next();
        }
        const cryptr = new Cryptr(config.sessionSecret);
        let decryptedKey;
        if(req.header('X-SE-API-KEY')){
            decryptedKey = cryptr.decrypt(encryptedApiKey);
        }else{
            decryptedKey = encryptDecrypt(encryptedApiKey);
        }

        let payload;
        if(decryptedKey){
            let parsedData = JSON.parse(decryptedKey);
            if(new Date().getTime() <= parsedData['expirationTimestamp']){
                payload = parsedData['payload'];
            }
        }

        if(!payload){
            return res.status(401).send({
                error : {
                    message : 'Not Authorized. Invalid credentials.'
                }
            });
        }

        if(
            !payload['X-API-KEY'] ||
            !payload['companyId'] ||
            !payload['queryKey'] ||
            !payload['environment'] ||
            typeof payload['environment'] !== 'string' ||
            typeof payload['X-API-KEY'] !== 'string' ||
            typeof payload['companyId'] !== 'string' ||
            typeof payload['queryKey'] !== 'string' 
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        //check query key 
        let queryValidation = await validateQueryKey(payload['queryKey']);
        if(queryValidation['error']){
            return res.status(500).send(queryValidation);
        }
        
        let decryptedApiKey = cryptr.decrypt(payload['X-API-KEY']);
        let parsedKey = JSON.parse(decryptedApiKey);
        const {
            userId='', userType='', companyId='',
            subscriptionId='',
            isInternal=false
        } = parsedKey;

        let environment = payload['environment'];
        if(
            (environment !== parsedKey['environment']) ||
            (
                isInternal && 
                (
                    (
                        !userId ||
                        typeof userId !== 'string'
                    ) && 
                    (userType !== 'systemUser')
                )
            ) ||
            !userType ||
            !companyId ||
            typeof companyId !== 'string' ||
            typeof userType !== 'string'
        ){
            return res.status(401).send({
                error : {
                    message : 'Not Authorized'
                }
            });
        }

        req.userType = userType;
        let user;
        if(userType === 'systemUser'){
            user = await getSystemUser(parsedKey, req);
            if(user['error']){
                return res.status(500).send({
                    error : {
                        message : user['error']['message']
                    }
                });
            }

            req.systemUser = true;
        }else{
            if(
                !subscriptionId ||
                typeof subscriptionId !== 'string'
            ){
                return res.status(401).send({
                    error : {
                        message : 'Not Authorized'
                    }
                });
            }

            user = await getSubscriptionUser(parsedKey);
            if(user['error']){
                return res.status(500).send({
                    error : {
                        message : user['error']['message']
                    }
                });
            }

            req.subscriptionId = subscriptionId;
        }

        req.isServerAuthorized = true;
        req.user = user;
        return next();
    }catch(e){
        console.log('/middleware/apikey/apiKeyValidation catch error', e)
        return res.status(500).send({
            error : {
                message : 'Internal server error.'
            }
        });
    }
}