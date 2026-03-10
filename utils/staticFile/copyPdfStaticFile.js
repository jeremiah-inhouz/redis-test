const config = require('../../config/config')();
const mongoose = require('mongoose');
const triggerFileStorageTransaction = require('../inhouzCloudStorage/triggerFileStorageTransaction');

module.exports = async (params={}) => {
    try{
        const {
            fileStorageServiceId='', fromFileKey='', toFileKey='',
            companyId='', user={}, appId='', bucketName='',
            projectId='', returnSignedUrl=false,
            expirationTimestamp
        } = params;

        const InhouzCloudStorageFileCollection = mongoose.model(config.inhouzCloudStorageFileModel);
        let originalFile = await InhouzCloudStorageFileCollection.findOne({
            companyId,
            fileKey : fromFileKey
        })
        .lean()
        .catch(e => {
            console.log('/copyPdfStaticFile get originalFile mongo error', e);
            return {error : true};
        });

        if(!originalFile){
            return {
                error : {
                    message : 'Original file was not found.'
                }
            }
        }

        if(originalFile['error']){
            return {
                error : {
                    message : 'An error occurred while finding original file.'
                }
            }
        }

        const {
            fileType=''
        } = originalFile;

        //download existing file
        let downloadResponse = await triggerFileStorageTransaction({
            companyId,
            fileName : fromFileKey,
            bucketName : originalFile['bucketName'] || '',
            fileStorageServiceId : originalFile['fileStorageServiceId'] || '',
            transactionType : 'downloadFile'
        });

        if(downloadResponse['error']){
            return {
                error : {
                    message : 'Failed to download file.'
                }
            }
        }

        const {base64=''} = downloadResponse;
        if(originalFile['_id']){
            delete originalFile['_id'];
        }
        let storageFile = await InhouzCloudStorageFileCollection.create({
            ...originalFile,
            fileName : toFileKey,
            fileKey : toFileKey,
            fileOriginId : appId,
            companyId,
            projectId,
            bucketName,
            fileStorageServiceId,
            hostedExternally : fileStorageServiceId ? true : false,
            createdTimestamp : new Date().getTime(),
            createdById : user['userId'] || user['_id'] || '',
            createdByEmail : user['email'] || '',
            createdByName : user['firstName'] || user['lastName'] ?
            `${user['firstName'] || ''} ${user['lastName'] || ''}`.trim()
            :
            ''
        })
        .catch(e => {
            console.log('/copyPdfStaticFile catch block error', e);
            return {error : true}
        });

        if(storageFile['error']){
            return {
                error : {
                    message : 'Failed to create new file.'
                }
            }
        }

        let transactionResponse = await triggerFileStorageTransaction({
            fileStorageServiceId,
            base64 : `data:${fileType};base64,${base64}`,
            fileName : toFileKey,
            fileType,
            companyId,
            transactionType : 'fileUpload',
            bucketName
        });

        if(transactionResponse['error']){
            await InhouzCloudStorageFileCollection.deleteOne({
                _id : storageFile['_id'].toString()
            })
            .catch(e => {
                console.log('/copyPdfStaticFile deleteStorageFile mongo error', e);
                return {deletedCount : 0}
            });

            return {
                error : {
                    message : 'Failed to upload file to cloud service.'
                }
            }
        }

        if(returnSignedUrl){
            let urlResponse = await triggerFileStorageTransaction({
                fileStorageServiceId,
                fileName : toFileKey,
                companyId,
                transactionType : 'generateSignedUrl',
                bucketName,
                expirationTimestamp
            });

            if(!urlResponse['fileUrl']){
                await InhouzCloudStorageFileCollection.deleteOne({
                    _id : storageFile['_id'].toString()
                })
                .catch(e => {
                    console.log('/uploadPdfStaticFile deleteStorageFile mongo error', e);
                    return {deletedCount : 0}
                });

                await triggerFileStorageTransaction({
                    fileStorageServiceId,
                    fileName : toFileKey,
                    companyId,
                    transactionType : 'deleteFile',
                    bucketName
                });

                return {
                    error : {
                        message : 'Failed to generate signed URL.'
                    }
                }
            }

            return urlResponse;
        }else{
            return {success : true}
        }
    }catch(e){
        console.log('/copyPdfStaticFile catch block error', e);
        return {error : true}
    }
}