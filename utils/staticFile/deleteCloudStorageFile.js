const config = require('../../config/config')();
const mongoose = require('mongoose');
const triggerFileStorageTransaction = require('../inhouzCloudStorage/triggerFileStorageTransaction');

module.exports = async (params={}) => {
    try{
        const {
            fileStorageServiceId='', fileKey='', bucketName='',
            companyId='', fileStorageCredentials={}
        } = params;

        let fileServiceId = fileStorageServiceId;
        const InhouzCloudStorageFileCollection = mongoose.model(config.inhouzCloudStorageFileModel);
        if(!fileStorageServiceId || (typeof fileStorageServiceId !== 'string')){
            let storedFile = await InhouzCloudStorageFileCollection.findOne({
                companyId,
                fileKey
            })
            .catch(e => {
                console.log('/deleteCloudStorageFile findFile mongo error', e);
                return {error : true};
            });

            if(
                !storedFile ||
                (
                    storedFile && 
                    storedFile['error']
                )
            ){
                return {error : true}
            }

            fileServiceId = storedFile['fileStorageServiceId'] || '';
        }
        await InhouzCloudStorageFileCollection.deleteOne({
            companyId,
            fileKey
        })
        .catch(e => {
            console.log('/deleteCloudStorageFile delete mongo error', e);
            return {deletedCount : 0};
        });

        await triggerFileStorageTransaction({
            fileStorageServiceId : fileServiceId,
            fileStorageCredentials,
            bucketName,
            companyId,
            fileName : fileKey,
            transactionType : 'deleteFile'
        });

        return {done : true}
    }catch(e){
        console.log('/deleteCloudStorageFile catch block error', e);
        return {error : true}
    }
}