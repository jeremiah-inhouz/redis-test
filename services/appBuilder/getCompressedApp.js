const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const getApp = require('../../utils/appBuilder/getApp');
const LZUTF8 = require('lzutf8');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        let response = await getApp(reqBody, req.user, req);
        if(response['error']){
            return res.send(response);
        }else{
            if(reqBody['skipCompression']){
                return res.send(response);
            }else{
                let compressedResponse = LZUTF8.compress(JSON.stringify(response), {
                    outputEncoding : 'Base64'
                });
                return res.send({compressedResponse});
            }
        }
    }catch(e){
        console.log('/services/appBuilder/getCompressedApp catch error', e);
        return res.send({
            error : {
                message : 'An error occured while loading app.'
            }
        })
    }
}