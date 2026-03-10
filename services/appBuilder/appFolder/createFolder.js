const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {folderName=''} = reqBody;
        const AppFolderCollection = mongoose.model(config.appFolderModel);
        if(
            !folderName ||
            typeof folderName !== 'string'
        ){
            return res.send({
                error : {
                    message : 'Required fields are missing.'
                }
            });
        }

        if(folderName.toLowerCase() === 'general'){
            return res.send({
                error : {
                    message : 'General is a reserved folder name'
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
                    message : 'Failed to create app folder.'
                }
            });
        }

        if(
            nameExists && 
            nameExists['_id']
        ){
            return res.send({
                error : {
                    message : 'Folder name already exists.'
                }
            });
        }

        let folder = await AppFolderCollection.create({
            ...reqBody,
            companyId : req.user['companyId'],
            createdById : req.user['_id'],
            createdDate : new Date().getTime()
        })
        .catch(e => {
            console.log('/appBuilder/appFolder/createFolder mongo error', e);
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
                    message : 'Failed to create app folder'
                }
            });
        }

        return res.send({
            ...JSON.parse(JSON.stringify(folder)),
            success : true
        });
    }catch(e){
        console.log('/services/appBuilder/appFolder/createFolder catch error', e);
        return res.send({
            error : {
                message : 'An error occured while creating app folder.'
            }
        });
    }
}