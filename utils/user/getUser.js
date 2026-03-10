const mongoose = require('mongoose');
const config = require('../../config/config')();
const {isEmpty, uniq} = require('lodash');

module.exports = async (userId='') => {
    try{
        if(
            !userId ||
            typeof userId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(userId)
        ){
            return {
                error : {
                    message : 'Invalid Query'
                }
            }
        }
    
        const UserCollection = mongoose.model(config.userModel);
        const userAccount = await UserCollection.findOne({
            _id : userId
        })
        .lean()
        .catch(e => {
            return {
                error : {
                    message : 'An error occured while getting users account information.',
                    errorPayload : e
                }
            }
        });
    
        if(
            !userAccount ||
            isEmpty(userAccount) ||
            userAccount['error']
        ){
            return {
                error : {
                    message : 'An error occured while getting users account information.'
                }
            }
        }
    
        const UserRolesCollection = mongoose.model(config.userRolesModel);
        let userRoles = await UserRolesCollection.findOne({
            userId, 
            companyId : userAccount['companyId']
        })
        .lean()
        .catch(e => {
            return {
                error : {
                    message : 'An error occured while getting users roles.'
                }
            }
        });
        if(
            !userRoles || 
            isEmpty(userRoles) ||
            (
                userRoles.roleIdList && 
                userRoles.roleIdList.length === 0
            )
        ){
            return {
                ...userAccount,
                permissions : [],
                permissionIdList : []
            }
        }

        if(userAccount['key']){
            delete userAccount['key'];
        }
        if(userAccount['passwordHash']){
            delete userAccount['passwordHash'];
        }

        let {
            roleIdList=[]
        } = userRoles;

        //get roles
        let RoleCollection = mongoose.model(config.roleModel);
        let roles = await RoleCollection.find({
            _id : {
                $in : roleIdList
            },
            companyId : userAccount['companyId']
        }).lean();

        if(!roles || roles.length === 0){
            return {
                ...userAccount,
                permissions : [],
                permissionIdList : []
            }
        }

        let permissionIds = [];
        for (let i = 0; i < roles.length; i++){
            let role = roles[i];
            let {
                permissionIdList=[]
            } = role;
            permissionIds.push(...permissionIdList);
        }

        let uniquePermissionIdList = uniq(permissionIds);
        if(uniquePermissionIdList.length === 0){
            return {
                ...userAccount,
                permissions : [],
                permissionIdList : []
            }
        }

        let PermissionCollection = mongoose.model(config.permissionModel);
        let permissionDocs = await PermissionCollection.find({
            _id : {
                $in : uniquePermissionIdList
            },
            companyId : userAccount['companyId']
        })
        .catch(e => {
            return {
                error : {
                    message : 'An error occured while getting permissions'
                }
            }
        });

        if(
            !permissionDocs ||
            isEmpty(permissionDocs) ||
            permissionDocs['error']
        ){
            return {
                ...userAccount,
                permissions : [],
                permissionIdList : []
            }
        }

        let permissionNames = permissionDocs.map(permission => permission['permissionName']);
        return {
            ...userAccount,
            permissions : permissionNames,
            permissionIdList : uniquePermissionIdList
        }
    }catch(e){
        console.log('getUsers catch block error', e)
        return {
            error : {
                message : 'An error occured while getting users account information.'
            }
        }
    }
}