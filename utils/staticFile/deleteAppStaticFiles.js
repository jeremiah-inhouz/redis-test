const config = require('../../config/config')();
const getFileStorageCredentials = require('../inhouzCloudStorage/getFileStorageCredentials');
const deleteCloudStorageFile = require('./deleteCloudStorageFile');

module.exports = async (params={}) => {
    try{
        const {
            elementIds=[], companyId='', staticFileIdMap={},
            deleteApp=false, fileStorageServiceId='',
            zeroTrustAccess=false, isPdfGenerator=false
        } = params;

        if(
            !companyId ||
            typeof companyId !== 'string' ||
            (elementIds.length === 0 && !deleteApp)
        ){
            return {
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            }
        }

        let staticFileIds = [];
        if(deleteApp){
            for (let k in staticFileIdMap){
                let fileId = staticFileIdMap[k];
                if(fileId && (typeof fileId === 'string')){
                    staticFileIds.push(fileId);
                }
            }
        }else{
            for (let i = 0; i < elementIds.length; i++){
                let elementId = elementIds[i];
                let fileId = staticFileIdMap[elementId];
                if(fileId && (typeof fileId === 'string')){
                    staticFileIds.push(fileId);
                }
            }
        }

        if(staticFileIds.length === 0){
            return {
                error : {
                    message : 'No file IDs.'
                }
            }
        }

        //generate credentials
        let fileStorageCredentials = {}
        if(!zeroTrustAccess || fileStorageServiceId){
            fileStorageCredentials = await getFileStorageCredentials({
                fileStorageServiceId,
                companyId,
                hostedExternally : fileStorageServiceId ? true : false
            });
        }

        for (let t = 0; t < staticFileIds.length; t++){
            let keyId = staticFileIds[t];
            await deleteCloudStorageFile({
                fileStorageServiceId,
                fileKey : keyId,
                bucketName : isPdfGenerator ? 
                config.inhouzPdfGeneratorDraftBucketName
                :
                config.inhouzSignDraftBucketName,
                companyId,
                fileStorageCredentials
            });
        }

        return {done : true};
    }catch(e){
        console.log('/utils/deleteAppStaticFiles catch block error', e);
        return {error : true};
    }
}