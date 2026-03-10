module.exports = async (req, res, next) => {
    try{
        if(req.isServerAuthorized){
            return next();
        }
        if(
            !req.company ||
            (
                req.company && 
                req.company['status'] !== 'active'
            )
        ){
            return res.status(403).send({
                error : {
                    message : 'Account is not active.'
                }
            });
        }else{
            return next();
        }
    }catch(e){
        console.log('/middleware/companyAccountCheck catch block error', e);
        return res.status(500).send({
            error : {
                message : 'An error occured in the account validation process.'
            }
        })
    }
}