const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const AppFolderCollection = mongoose.model(config.appFolderModel);
        let {_id='', folderName=''} = reqBody;
        if(
            !_id ||
            typeof _id !== 'string' ||
            !folderName ||
            typeof folderName !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Required fields are missing.'
                }
            })
        }
        if(folderName.toLowerCase() === 'general'){
            return res.send({
                error : {
                    message : 'General is a reserved folder name'
                }
            });
        }
        let existingFolder = await AppFolderCollection.findOne({
            _id,
            companyId : req.user['companyId']
        })
        .lean()
        .catch(e => {
            return {error : true};
        });

        if(
            !existingFolder
        ){
            return res.send({
                error : {
                    message : 'App folder was not found.'
                }
            });
        }

        if(
            existingFolder && 
            existingFolder['error']
        ){
            return res.send({
                error : {
                    message : 'Failed to update app folder.'
                }
            });
        }

        //check if name exists
        let nameExists = await AppFolderCollection.findOne({
            folderName,
            companyId : req.user['companyId']
        })
        .lean()
        .catch(e => {
            return {error : true}
        });

        if(
            nameExists && 
            nameExists['error']
        ){
            return res.send({
                error : {
                    message : 'Failed to edit app folder.'
                }
            });
        }

        if(
            nameExists && 
            nameExists['_id'] && 
            (nameExists['_id'].toString() !== _id)
        ){
            return res.send({
                error : {
                    message : 'Folder name already exists.'
                }
            });
        }

        let {
            restrictEditAccess=false, editPermissionIds=[]
        } = existingFolder;
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
                let hasPermission = false;
                let userPermissionIds = req.user['permissionIdList'];
                for (let i = 0; i < userPermissionIds.length; i++){
                    let permissionId = userPermissionIds[i];
                    if(editPermissionIds.includes(permissionId)){
                        hasPermission = true;
                        break;
                    }
                }

                if(!hasPermission){
                    return res.send({
                        error : {
                            message : 'Access denied. Not permitted to update app folder.'
                        }
                    });
                }
            }
        }

        //update app folder
        let updateResponse = await AppFolderCollection.updateOne(
            {
                _id,
                companyId : req.user['companyId']
            },
            {
                ...reqBody,
                companyId : req.user['companyId'],
                lastUpdatedById : req.user['_id'],
                editDate : new Date().getTime()
            }
        )
        .catch(e => {
            console.log('/services/appBuilder/appFolder/editFolder catch error', e);
            return {modifiedCount : 0}
        });

        if(updateResponse && updateResponse['modifiedCount']){
            return res.send({success : true});
        }else{
            return res.send({success : false});
        }
    }catch(e){
        console.log('/services/appBuilder/appFolder/editFolder catch error', e);
        return res.send({
            error : {
                message : 'Failed to update app folder.'
            }
        });
    }
}