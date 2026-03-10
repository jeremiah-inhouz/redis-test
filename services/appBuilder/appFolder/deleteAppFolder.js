const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqParams = recursiveSanitizer(req.params, sanitizer);
        const {folderId=''} = reqParams;

        if(
            !folderId ||
            typeof folderId !== 'string'
        ){
            return res.send({
                error : {
                    message : 'App folder ID is required'
                }
            });
        }

        const AppFolderCollection = mongoose.model(config.appFolderModel);

        //check if apps exist with the folderId
        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        let app = await InhouzAppCollection.findOne({
            folderId,
            companyId : req.user['companyId']
        })
        .lean()
        .catch(e => {
            return false
        });

        if(
            app && 
            app['_id']
        ){
            return res.send({
                error : {
                    message : 'Folder has existing apps. Remove apps from folder to delete folder.'
                }
            });
        }

        //get folder
        let folder = await AppFolderCollection.findOne({
            _id : folderId,
            companyId : req.user['companyId']
        })
        .lean()
        .catch(e => {
            return false;
        });

        if(
            !folder ||
            (
                folder && 
                !folder['_id']
            )
        ){
            return res.send({
                error : {
                    message : 'Folder was not found.'
                }
            });
        }

        let {restrictEditAccess=false, editPermissionIds=[]} = folder;

        if(
            restrictEditAccess && 
            editPermissionIds.length > 0
        ){
            let isAdmin = false;
            let userPermissions = req.user['permissions'] || [];
            for (let i = 0; i < userPermissions.length; i++){
                let permission = userPermissions[i];
                if(config.adminPermissions.includes(permission)){
                    isAdmin = true;
                    break;
                }
            }

            if(!isAdmin){
                let hasPermission = false, userPermissionIds = req.user['permissionIdList'];
                for (let x = 0; x < userPermissionIds.length; x++){
                    let permissionId = userPermissionIds[x];
                    if(editPermissionIds.includes(permissionId)){
                        hasPermission = true;
                        break;
                    }
                }
                if(!hasPermission){
                    return res.send({
                        error : {
                            message : 'Access denied. Not permitted to delete app folder.'
                        }
                    })
                }
            }
        }

        let deleteResponse = await AppFolderCollection.remove({
            _id : folderId,
            companyId : req.user['companyId']
        })
        .catch(e => {
            console.log('/services/appFolder/deleteAppFolder mongo catch', e);
            return {deletedCount : 0}
        });

        return res.send({
            success : deleteResponse && deleteResponse['deletedCount'] ? true : false
        });
    }catch(e){
        console.log('/services/appBuilder/appFolder/deleteAppFolder catch error', e);
        return res.send({
            error : {
                message : 'An error occured while deleting app folder.'
            }
        });
    }
}