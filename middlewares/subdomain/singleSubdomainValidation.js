module.exports = async (req, res, next) => {
    try{
        if(req.isServerAuthorized){
            return next();
        }
        let subdomains = req.subdomains;
        let subdomain = subdomains[0] && subdomains[0].toLowerCase();
        if(
            !subdomain ||
            subdomain === 'www' ||
            subdomain === req.user['subDomain']
        ){
            return next();
        }else{
            return res.send({
                error : {
                    message : 'Failed subdomain validation'
                }
            });
        }
    }catch(e){
        return res.send({
            error : {
                message : 'Failed subdomain validation'
            }
        });
    }
}