const config = require('../../config/config')();
const mongoose = require('mongoose');

module.exports = async (info={}, req) => {
    try{
        const {
            companyId='', userId='', environment=''
        } = info;
        if(
            !companyId ||
            !userId ||
            typeof userId !== 'string' ||
            typeof companyId !== 'string'
        ){
            return {
                error : {
                    message : 'Invalid request'
                }
            }
        }

        const SystemUserCollection = mongoose.model(config.systemUserModel);
        let systemUser = await SystemUserCollection.findOne({
            companyId,
            _id : userId
        })
        .catch(e => {
            console.log('/utils/systemUser/getSystemUser getSystemUser mongo catch error', e);
            return {error : e}
        });

        if(!systemUser){
            return {
                error : {
                    message : 'System user not found.'
                }
            }
        }

        if(
            systemUser && 
            systemUser['error']
        ){
            return {
                error : {
                    message : 'Failed to find system user.'
                }
            }
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let company = await CompanyCollection.findOne({
            _id : companyId,
            status : 'active'
        })
        .lean()
        .catch(e => {
            console.log('get company mongo catch error', e)
            return {error : true};
        });

        if(
            !company
        ){
            return {
                error : {
                    message : 'Company not found.'
                }
            };
        }
        if(
            company && 
            company['error']
        ){
            return {
                error : {
                    message : 'Failed to get company data.'
                }
            };
        }

        const PermissionCollection = mongoose.model(config.permissionModel);
        let permissions = await PermissionCollection.find({
            companyId,
            _id : {
                $in : systemUser['permissionIds'] || []
            }
        })
        .catch(e => {
            console.log('get permissions catch error', e);
            return {error : e}
        });

        if(permissions && permissions['error']){
            return {
                error : {
                    message : 'Failed to get system user permissions.'
                }
            }
        }

        let permissionNames = permissions.map(permission => permission['permissionName']);
        req.userCompany = company;
        return {
            userName : systemUser['userName'] || '',
            firstName : systemUser['userName'] || '',
            lastName : '',
            email : systemUser['email'] || '',
            permissionIds : systemUser['permissionIds'] || [],
            permissionNames,
            permissions : permissionNames,
            userType : 'systemUser',
            companyName : company['companyName'] || '',
            industry : company['industry'] || '',
            companyId,
            _id : userId,
            isInternal : true,
            environment,
            isSystemUser : true,
            isAuthenticated : true
        }
    }catch(e){
        console.log('/utils/systemUser/getSystemUser catch error', e);
        return {
            error : {
                message : 'Failed to get system user.',
                errorPayload : e
            }
        }
    }
}