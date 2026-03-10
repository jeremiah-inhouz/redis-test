const config = require("../../config/config")();
const { isEmpty } = require("lodash");
const awsS3CopyFile = require("./aws/awsS3CopyFile");
const awsS3DeleteFile = require("./aws/awsS3DeleteFile");
const awsS3DownloadFile = require("./aws/awsS3DownloadFile");
const awsS3FileUpload = require("./aws/awsS3FileUpload");
const awsS3GenerateSignedUrl = require("./aws/awsS3GenerateSignedUrl");
const getFileStorageCredentials = require("./getFileStorageCredentials");
const googleCloudCopyFile = require("./googleCloud/googleCloudCopyFile");
const googleCloudDeleteFile = require("./googleCloud/googleCloudDeleteFile");
const googleCloudDownloadFile = require("./googleCloud/googleCloudDownloadFile");
const googleCloudGenerateSignedUrl = require("./googleCloud/googleCloudGenerateSignedUrl");
const googleCloudUploadFile = require("./googleCloud/googleCloudUploadFile");
const azureCopyFile = require("./microsoftAzure/azureCopyFile");
const azureDeleteFile = require("./microsoftAzure/azureDeleteFile");
const azureDownloadFile = require("./microsoftAzure/azureDownloadFile");
const azureFileUpload = require("./microsoftAzure/azureFileUpload");
const azureGenerateSignedUrl = require("./microsoftAzure/azureGenerateSignedUrl");

module.exports = async (params={}) => {
    try{
        const {
            fileStorageServiceId='',
            base64='', fileName='', fileType='',
            companyId='', transactionType=''
        } = params;

        let credentials, storageLocation, 
        credentialResponse, 
        hostedExternally=fileStorageServiceId ? true : false;

        if(
            !params['fileStorageCredentials'] ||
            (
                params['fileStorageCredentials'] && 
                isEmpty(params['fileStorageCredentials'])
            )
        ){
            let credentialParams = {
                companyId,
                fileStorageServiceId,
                hostedExternally
            }
            credentialResponse = await getFileStorageCredentials(credentialParams);
            if(credentialResponse['error']){
                return credentialResponse;
            }
        }else{
            credentialResponse = params['fileStorageCredentials'];
        }

        credentials = credentialResponse['credentials'];
        storageLocation = credentialResponse['storageLocation'];

        let transactionResponse;
        if(transactionType === 'fileUpload'){
            let uploadPayload = {
                credentials,
                base64,
                fileName,
                fileType
            }
            if(storageLocation === config.googleStorageLocation){
                transactionResponse = await googleCloudUploadFile({
                    ...uploadPayload,
                    bucketName : credentialResponse['bucketName'] || params['bucketName']
                });
            }else if(storageLocation === config.awsS3StorageLocation){
                transactionResponse = await awsS3FileUpload(uploadPayload);
            }else if(storageLocation === config.azureStorageLocation){
                transactionResponse = await azureFileUpload(uploadPayload);
            }
        }else if(transactionType === 'deleteFile'){
            let deletePayload = {
                credentials,
                fileName
            }

            if(storageLocation === config.googleStorageLocation){
                transactionResponse = await googleCloudDeleteFile({
                    ...deletePayload,
                    bucketName : credentialResponse['bucketName'] || params['bucketName']
                });
            }else if(storageLocation === config.awsS3StorageLocation){
                transactionResponse = await awsS3DeleteFile(deletePayload);
            }else if(storageLocation === config.azureStorageLocation){
                transactionResponse = await azureDeleteFile(deletePayload);
            }
        }else if(transactionType === 'copyFile'){
            let copyPayload = {
                credentials,
                fromFileName : params['fromFileName'],
                toFileName : params['toFileName']
            }

            if(storageLocation === config.googleStorageLocation){
                transactionResponse = await googleCloudCopyFile({
                    ...copyPayload,
                    fromBucketName : credentialResponse['bucketName'] || params['bucketName'],
                    toBucketName : credentialResponse['bucketName'] || params['bucketName']
                });
            }else if(storageLocation === config.awsS3StorageLocation){
                transactionResponse = await awsS3CopyFile({
                    ...copyPayload,
                    fromBucketName : credentials['awsBucketName'],
                    toBucketName : credentials['awsBucketName']
                });
            }else if(storageLocation === config.azureStorageLocation){
                transactionResponse = await azureCopyFile(copyPayload);
            }
        }else if(transactionType === 'generateSignedUrl'){
            let signedUrlPayload = {
                fileName,
                credentials,
                expirationTimestamp : params['expirationTimestamp']
            }

            if(storageLocation === config.googleStorageLocation){
                transactionResponse = await googleCloudGenerateSignedUrl({
                    ...signedUrlPayload,
                    bucketName : credentialResponse['bucketName'] || params['bucketName']
                });
            }else if(storageLocation === config.awsS3StorageLocation){
                transactionResponse = await awsS3GenerateSignedUrl(signedUrlPayload);
            }else if(storageLocation === config.azureStorageLocation){
                transactionResponse = await azureGenerateSignedUrl(signedUrlPayload);
            }
        }else if(transactionType === 'downloadFile'){
            let downloadPayload = {
                fileName,
                credentials
            }

            if(storageLocation === config.googleStorageLocation){
                transactionResponse = await googleCloudDownloadFile({
                    ...downloadPayload,
                    bucketName : credentialResponse['bucketName'] || params['bucketName']
                });
            }else if(storageLocation === config.awsS3StorageLocation){
                transactionResponse = await awsS3DownloadFile(downloadPayload);
            }else if(storageLocation === config.azureStorageLocation){
                transactionResponse = await azureDownloadFile(downloadPayload);
            }
        }else{
            return {
                error : {
                    message : 'Invalid file storage transaction.'
                }
            }
        }

        return transactionResponse;
    }catch(e){
        console.log('/triggerFileStorageTransaction catch block error', e);
        return {
            error : {
                message : 'Failed to execute file storage transaction.'
            }
        }
    }
}