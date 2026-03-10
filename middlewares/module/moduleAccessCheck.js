const mongoose = require('mongoose');
const sanitizer = require('sanitizer');
const sanitizeFunction = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');

module.exports = async (req, res, next) => {
    try{
        let body = sanitizeFunction.recursiveSanitizer(req.body, sanitizer);
        const {moduleId, moduleName} = body;
        if(!typeof moduleName === 'string' || !typeof moduleId === 'string'){
            return res.send({
                error : {
                    message : 'Module Access Denied',
                    errorPayload : {}
                }
            })
        }
        let moduleSplit = (moduleName && moduleName.split('_')) || [];
        if(!moduleSplit.length > 1 || moduleSplit[moduleSplit.length - 1] !== req.user.companyId){
            return res.send({
                error : {
                    message : 'Module Access Denied',
                    errorPayload : {}
                }
            });
        }
        //check if user has access to module
        let FlexModule = mongoose.model(config.flexModuleModel);
        let Module = await FlexModule.findOne({
            companyId : req.user.companyId,
            _id : body.moduleId
        }).lean();

        if(_.isEmpty(Module)){
            return res.send({
                error : {
                    message : 'Module Access Denied',
                    errorPayload : {}
                }
            })
        }

        if(Module.restrictedAccess){
            let permittedIds = Module.usersWithAccess && Module.usersWithAccess.map(user => user.userId);
            if(!Array.isArray(permittedIds) || !permittedIds.includes(req.user._id)){
                return res.send({
                    error : {
                        message : 'Module Access Denied',
                        errorPayload : {}
                    }
                })
            }
        }

        req.Module = Module;
        next();
    }catch(err){
        console.log('Module Access Middleware catch block error', err);
        return res.send({
            error : {
                message : 'An error occured. Please try again',
                errorPayload : err
            }
        })
    }
}