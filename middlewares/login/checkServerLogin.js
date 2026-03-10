const mongoose = require('mongoose');
const config = require('../../config/config')();
const Cryptr = require('cryptr');

module.exports = async (req, res, next) => {
    try{
        let serverEncryptedHeader = req.header('serverEncryptedHeader');
        if(
            !serverEncryptedHeader ||
            typeof serverEncryptedHeader !== 'string'
        ){
            return next();
        }

        const cryptr = new Cryptr(config.sessionSecret);
        let decryptedPayload = cryptr.decrypt(serverEncryptedHeader);
        let payload;
        if(decryptedPayload){
            let parsed = JSON.parse(decryptedPayload);
            if(new Date().getTime() <= parsed['expirationTimestamp']){
                payload = parsed['payload'];
            }
        }

        if(!payload){
            return res.status(404).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        const {user={}} = payload;
        const {
            companyId='', _id
        } = user;

        if(
            !_id ||
            !companyId ||
            typeof _id !== 'string' ||
            typeof companyId !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        let CompanyCollection = mongoose.model(config.companyModel);
        let company = await CompanyCollection.findOne({
            _id : companyId
        })
        .lean()
        .catch(e => {
            return false;
        });

        if(!company){
            return res.status(404).send({
                error : {
                    message : 'An error occured in the Authentication process'
                }
            });
        }

        req.company = JSON.parse(JSON.stringify(company));

        if(company._id){
            delete company['_id'];
        }

        req['user'] = {
            ...user,
            ...company
        };
        req.isServerAuthorized = true;
        return next();
    }catch(e){
        console.log('/middlewares/login/checkServerLogin catch block error', e);
        return res.status(500).send({
            error : {
                message : 'An error occurred in the server authorization process.'
            }
        })
    }
}