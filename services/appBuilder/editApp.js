const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const editApp = require('../../utils/appBuilder/editApp');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        let response = await editApp(reqBody, req.user);
        if(response['error']){
            return res.send(response);
        }else{
            return res.send({success : true});
        }
    }catch(e){
        console.log('/services/appBuilder/editApp catch error', e);
        return res.send({
            error : {
                message : 'App update failed.'
            }
        })
    }
}