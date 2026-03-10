const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const editInhouzElement = require('../../utils/appBuilder/editInhouzElement');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const updateResponse = await editInhouzElement(
            reqBody,
            req.user
        ); 
        return res.send(updateResponse);
    }catch(e){
        console.log('/services/appBuilder/editElement catch error', e);
        return res.send({
            error : {
                message : 'App update failed'
            }
        });
    }
}