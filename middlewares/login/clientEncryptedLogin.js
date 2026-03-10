const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');
const getSystemUser = require('../../utils/systemUser/getSystemUser');
const getSubscriptionUser = require('../../utils/subscriptionUser/getSubscriptionUser');

module.exports = async (req, res, next) => {
    try{
        if(req.isServerAuthorized){
            return next();
        }
        let clientEncryptedAccessHeader = req.header('clientEncryptedAccessHeader');
        if(
            !clientEncryptedAccessHeader ||
            typeof clientEncryptedAccessHeader !== 'string'
        ){
            return next();
        }

        let payload;
        let decryptedPayload = encryptDecrypt(clientEncryptedAccessHeader);
        let parsedData = JSON.parse(decryptedPayload);
        if(new Date().getTime() <= parsedData['expirationTimestamp']){
            payload = parsedData['payload'];
        }

        if(!payload){
            return next();
        }

        const {
            assetOwnerCompanyId='', companyId='', email='',
            subscriptionId='', subscriptionServiceId='',
            environment='', _id='', userId='', isSystemUser=false,
            isInternal=false
        } = payload;

        let user;
        req.assetOwnerCompanyId = assetOwnerCompanyId;
        if(isSystemUser){
            user = await getSystemUser(
                {
                    userId : userId || _id,
                    companyId : assetOwnerCompanyId || companyId,
                    environment
                },
                req
            );

            if(user['error']){
                return res.status(500).send(user);
            }

            req.user = user;
            req.isServerAuthorized = true;
            return next();
        }else{
            user = await getSubscriptionUser({
                companyId,
                assetOwnerCompanyId,
                email,
                subscriptionId,
                subscriptionServiceId,
                userId : userId || _id,
                isInternal
            });

            if(user['error']){
                return res.status(500).send(user);
            }

            req.user = user;
            req.isServerAuthorized = true;
            return next();
        }
    }catch(e){
        console.log('/middlewares/login/clientEncryptedLogin catch block error', e);
        return res.status(500).send({
            error : {
                message : 'An error occurred in the authorization process'
            }
        });
    }
}