const mongoose = require('mongoose');
const config = require('../../config/config')();
const Cryptr = require('cryptr');
const moment = require('moment');
const {isEmpty} = require('lodash');
const getUser = require('../../utils/user/getUser');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');

module.exports = async (req, res, next) => {
    try{
        if(req.isServerAuthorized){
            return next();
        }
        let sessionToken = (req.cookies && req.cookies.SMPL) || req.header('x-access-token');
        let csrfKey = req.header('x-csrfToken');
        if(!sessionToken){
            return res.send({
                error : {
                    message : 'Not Authorized'
                }
            });
        }
        const cryptr = new Cryptr(config.sessionSecret);
        const sessionId = cryptr.decrypt(sessionToken);
        const csrfToken = cryptr.decrypt(csrfKey);
        const datestamp = new Date().getTime();
        const SessionCollection = mongoose.model(config.sessionModel);
        const session = await SessionCollection.findOne({
            _id : sessionId,
            csrfToken
        })
        .catch(e => {
            return {
                error : {
                    message : 'An error occured while getting session data'
                }
            }
        });

        if(
            !session || isEmpty(session) ||
            (session && !session['_id'])
        ){
            return res.send({
                error : {
                    message : 'Not Authorized'
                }
            });
        }

        if(session && session['error']){
            return res.send({
                error : {
                    message : session['error']['message']
                }
            });
        }

        if(session && session['_id']){
            const {
                userId='',
                expirationTimestamp
            } = session;

            if(
                datestamp > expirationTimestamp
            ){
                return res.send({
                    error : {
                        message : 'Not Authorized'
                    }
                });
            }

            let user = await getUser(userId);
            if(!user || user['error'] || !user['_id']){
                return res.send({
                    error : {
                        message : 'An error occured in the Authentication process'
                    }
                });
            }

            //update session 
            let sessionExpirationDate=moment().add(60, 'minutes').unix() * 1000;
            let updateResponse = await SessionCollection.updateOne(
                {
                    _id : sessionId
                },
                {
                    $set : {
                        expirationTimestamp : sessionExpirationDate
                    }
                }
            )
            .catch(e => {
                return {modifiedCount : 0}
            })

            if(!updateResponse['modifiedCount']){
                return res.send({
                    error : {
                        message : 'An error occured in the Authentication process'
                    }
                });
            }

            let CompanyCollection = mongoose.model(config.companyModel);
            let company = await CompanyCollection.findOne({
                _id : user.companyId
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
                ...company,
                expirationTimestamp
            };
            
            let encryptedCsrf = cryptr.encrypt(csrfToken);
            let clientEncrypt = encryptDecrypt(encryptedCsrf, true).replace(/\+/g,'p1L2u3S').replace(/\//g,'s1L2a3S4h').replace(/=/g,'e1Q2u3A4l');
            res.cookie('x-java', clientEncrypt, {
                httpOnly : false,
                secure : ['prod', 'production', 'uat'].includes(
                    process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()
                ) ? true : false, 
                maxAge : sessionExpirationDate,
                domain : config.cookieDomain,
            });
            res.cookie('sessionExpirationTimestamp', sessionExpirationDate, {
                httpOnly : false,
                secure : ['prod', 'production', 'uat'].includes(
                    process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()
                ) ? true : false, 
                maxAge : sessionExpirationDate,
                domain : config.cookieDomain,
            });
            next();
        }
    }catch(e){
        console.log('/middlewares/login/checkLogin catch block error', e);
        return res.send({
            error : {
                message : 'An error occured in the authorization process'
            }
        })
    }
}