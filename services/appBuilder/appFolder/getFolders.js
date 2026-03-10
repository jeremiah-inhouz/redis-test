const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {filter={}, sort={}, limit=0, skip=0} = reqBody;
        const AppFolderCollection = mongoose.model(config.appFolderModel);
        let folders = await AppFolderCollection.find({
            ...filter,
            companyId : req.user['companyId']
        })
        .limit(limit)
        .skip(skip)
        .sort(sort)
        .catch(e => {
            return {error : true}
        });

        if(folders && folders['error']){
            return res.send({
                error : {
                    message : 'Failed to get app folders'
                }
            });
        }

        let permittedFolders = [];
        for (let i = 0; i < folders.length; i++){
            let folder = folders[i];
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
                        continue;
                    }else{
                        permittedFolders.push(folder);
                    }
                }else{
                    permittedFolders.push(folder);
                }
            }else{
                permittedFolders.push(folder);
            }
        }

        return res.send({results : permittedFolders});
    }catch(e){
        console.log('/services/appBuilder/appFolder/getFolders catch error', e);
        return res.send({
            error : {
                message : 'An error occured while getting app folders.'
            }
        });
    }
}