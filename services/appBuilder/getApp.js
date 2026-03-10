const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const getApp = require('../../utils/appBuilder/getApp');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        let response = await getApp(reqBody, req.user, req);
        return res.send(response);
    }catch(e){
        console.log('/services/appBuilder/getApp catch error', e);
        return res.send({
            error : {
                message : 'An error occured while loading app.'
            }
        })
    }
}