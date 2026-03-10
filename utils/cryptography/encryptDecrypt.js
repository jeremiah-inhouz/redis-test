const config = require('../../config/config')();

module.exports = function(data, encrypt=false){
    try{
        let privateKey = config.NodeRsaClientPrivateKey;
        let parsed;
        if(encrypt){
            parsed = privateKey.encryptPrivate(data, 'base64');
        }else{
            parsed = privateKey.decrypt(data, 'utf8');
        }
        return parsed;
    }catch(e){
        console.log('encryptDecryptRsa error', e)
        return data;
    }
}