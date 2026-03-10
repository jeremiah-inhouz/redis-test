const config = require('../../config/config')();

module.exports = (req, res, next) => {
    try{
        if(req.isServerAuthorized){
            return next();
        }
        let user = req.user || {};
        if(
            user && user.permissions && 
            user.permissions.includes(config.deleteAppPermission)
        ){
            return next();
        }
        return res.send({
            error : {
                message : 'Not Authorized.'
            }
        });
    }catch(e){
        return res.send({
            error : {
                message : 'An error occured in the authorization process.'
            }
        })
    }
}