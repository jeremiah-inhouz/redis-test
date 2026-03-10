const Cryptr = require('cryptr');
const _ = require('lodash');

module.exports = (params={}) => {
    try{
        const {
            storageService={}, secret='', action=''
        } = params;
        const {
            googleProjectId='', googlePrivateKeyId='', googlePrivateKey='',
            googleClientEmail='', googleClientId='', googleClientX509CertUrl='',
        } = storageService;

        if(
            !googleProjectId ||
            !googlePrivateKeyId ||
            !googlePrivateKey ||
            !googleClientEmail ||
            !googleClientId ||
            !googleClientX509CertUrl ||
            !secret
        ){
            return {
                error : {
                    message : `Incomplete Google Cloud credentials.`
                }
            }
        }

        const cryptr = new Cryptr(secret);

        return {
            "type": "service_account",
            "project_id": googleProjectId ? 
            cryptr.decrypt(googleProjectId) : '',
            "private_key_id": googlePrivateKeyId ? 
            cryptr.decrypt(googlePrivateKeyId) : '',
            "private_key": googlePrivateKey ? 
            _.replace(cryptr.decrypt(googlePrivateKey), new RegExp("\\\\n", "\g"), "\n") : '',
            "client_email": googleClientEmail ? 
            cryptr.decrypt(googleClientEmail) : '',
            "client_id": googleClientId ? 
            cryptr.decrypt(googleClientId) : '',
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": googleClientX509CertUrl ? 
            cryptr.decrypt(googleClientX509CertUrl) : ''
          }
    }catch(e){
        console.log('/utils/inhouzCloudStorage/getGoogleCredentialsObject catch error', e);
        return {
            error : {
                message : 'Failed to get Google Cloud credentials.'
            }
        }
    }
}