const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const editAppPage = require('../../utils/appBuilder/editAppPage');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const updateResponse = await editAppPage(
            {
                ...reqBody,
                companyId : req.user['companyId']
            },
            req.user
        );
        return res.send(updateResponse);
    }catch(e){
        console.log('/services/appBuilder/editAppPage catch error', e);
        return res.send({
            error : {
                message : 'App update failed'
            }
        });
    }
}