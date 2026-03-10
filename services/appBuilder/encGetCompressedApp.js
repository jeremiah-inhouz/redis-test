const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const getApp = require('../../utils/appBuilder/getApp');
const LZUTF8 = require('lzutf8');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {encryptedPayload=''} = reqBody;
        if(
            !encryptedPayload ||
            typeof encryptedPayload !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid query. Required fields are missing.'
                }
            });
        }

        let payload;
        let decryptedPayload = encryptDecrypt(encryptedPayload);
        if(decryptedPayload){
            let parsedData = JSON.parse(decryptedPayload);
            if(new Date().getTime() <= parsedData['expirationTimestamp']){
                payload = parsedData['payload'];
            }
        }

        if(
            !payload ||
            typeof payload !== 'object'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid query. Required fields are missing.'
                }
            });
        }
        let response = await getApp(payload, req.user, req);
        if(response['error']){
            return res.send(response);
        }else{
            if(payload['skipCompression']){
                return res.send(response);
            }else{
                let compressedResponse = LZUTF8.compress(JSON.stringify(response), {
                    outputEncoding : 'Base64'
                });
                return res.send({compressedResponse});
            }
        }
    }catch(e){
        console.log('/services/appBuilder/encGetCompressedApp catch error', e);
        return res.send({
            error : {
                message : 'An error occured while loading app.'
            }
        })
    }
}