const config = require('../../config/config')();
const mongoose = require('mongoose');
const sizeof = require('object-sizeof');
const triggerFileStorageTransaction = require('../inhouzCloudStorage/triggerFileStorageTransaction');

module.exports = async (params={}) => {
    try{
        const {
            fileStorageServiceId='', base64='', fileType='',
            fileKey='', fileName='', companyId='', returnSignedUrl='',
            expirationTimestamp=0, fileStorageCredentials={},
            fileOrigin='', fileOriginId='', projectId='',
            metaTag='', bucketName='', user={}
        } = params;

        const InhouzCloudStorageFileCollection = mongoose.model(config.inhouzCloudStorageFileModel);
        let storageFile = await InhouzCloudStorageFileCollection.create({
            fileName,
            fileKey,
            fileSizeBytes : sizeof(base64),
            fileOrigin,
            fileOriginId,
            fileType,
            companyId,
            projectId,
            metaTag,
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
            console.log('/uploadPdfStaticFile catch block error', e);
            return {error : true}
        });

        if(!storageFile['_id']){
            return {
                error : {
                    message : 'Failed to create storage file.'
                }
            }
        }

        //upload transaction
        let transactionResponse = await triggerFileStorageTransaction({
            fileStorageServiceId,
            base64,
            fileName : fileKey,
            fileType,
            companyId,
            transactionType : 'fileUpload',
            fileStorageCredentials,
            bucketName
        });

        if(transactionResponse['error']){
            await InhouzCloudStorageFileCollection.deleteOne({
                _id : storageFile['_id'].toString()
            })
            .catch(e => {
                console.log('/uploadPdfStaticFile deleteStorageFile mongo error', e);
                return {deletedCount : 0}
            });
        }

        if(returnSignedUrl){
            let urlResponse = await triggerFileStorageTransaction({
                fileStorageServiceId,
                fileName : fileKey,
                companyId,
                transactionType : 'generateSignedUrl',
                fileStorageCredentials,
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
                    fileName : fileKey,
                    companyId,
                    transactionType : 'deleteFile',
                    fileStorageCredentials,
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
        console.log('/uploadPdfStaticFile catch block error', e);
        return {error : true}
    }
}