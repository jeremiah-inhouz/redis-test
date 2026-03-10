const config = require('../../config/config')();
const Cryptr = require('cryptr');
const mongoose = require('mongoose');
const getGoogleCredentialObject = require('./getGoogleCredentialObject');

module.exports = async (params={}) => {
    try{
        const {
            hostedExternally=false, fileStorageServiceId='',
            companyId=''
        } = params;

        if(hostedExternally && fileStorageServiceId){
            let extraQuery = {};
            if(companyId){
                extraQuery['companyId'] = companyId;
            }

            const FileStorageServiceCollection = mongoose.model(config.fileStorageServiceModel);
            let storageService = await FileStorageServiceCollection.findOne({
                _id : fileStorageServiceId,
                ...extraQuery
            })
            .lean()
            .catch(e => {
                console.log('/getFileStorageCredentials getStorageService mongo error', e);
                return {error : true};
            });

            if(!storageService){
                return {
                    error : {
                        message : 'File storage service was not found.'
                    }
                }
            }

            if(storageService && storageService['error']){
                return {
                    error : {
                        message : 'An error occurred while finding file storage service.'
                    }
                }
            }

            const {
                storageLocation='', s3AccessKeyId='',
                s3SecretAccessKey='', awsBucketName='', awsRegion='',
                azureContainerName='', azureBlobSasUrl='', azureStorageAccountKey='',
                googleBucketName='', 
            } = storageService;
    
            const secret = `${config.sessionSecret}_${storageService['companyId']}`;
            const cryptr = new Cryptr(secret);

            if(storageLocation === config.awsS3StorageLocation){
                return {
                    storageLocation,
                    credentials : {
                        s3AccessKeyId : cryptr.decrypt(s3AccessKeyId),
                        s3SecretAccessKey : cryptr.decrypt(s3SecretAccessKey),
                        awsBucketName : awsBucketName ? 
                        cryptr.decrypt(awsBucketName) : '',
                        awsRegion : awsRegion ? 
                        cryptr.decrypt(awsRegion) : ''
                    }
                }
            }else if(storageLocation === config.azureStorageLocation){
                return {
                    storageLocation,
                    credentials : {
                        azureContainerName : azureContainerName ? 
                        cryptr.decrypt(azureContainerName) : '',
                        azureBlobSasUrl : azureBlobSasUrl ? 
                        cryptr.decrypt(azureBlobSasUrl) : '',
                        azureStorageAccountKey : azureStorageAccountKey ? 
                        cryptr.decrypt(azureStorageAccountKey) : ''
                    }
                }
            }else if(storageLocation === config.googleStorageLocation){
                let gcpCred = getGoogleCredentialObject({
                    storageService,
                    secret,
                    action
                });
                if(gcpCred['error']){
                    return gcpCred;
                }
                return {
                    storageLocation,
                    credentials : gcpCred,
                    bucketName : googleBucketName ? 
                    cryptr.decrypt(googleBucketName) : ''
                };
            }else{
                return {
                    error : {
                        message : 'File uploads are currently not supported for the specified cloud location.'
                    }
                }
            }
        }else{
            return {
                storageLocation : config.googleStorageLocation,
                credentials : {
                    "type": "service_account",
                    "project_id": config.gcsProjectId,
                    "private_key_id": config.gcsPrivateKeyId,
                    "private_key": config.gcsPrivateKey.split(String.raw`\n`).join('\n'),
                    "client_email": config.gcsClientEmail,
                    "client_id": config.gcsClientId,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": config.gcsClientX509CertUrl,
                    "universe_domain": "googleapis.com"
                }
            }
        }
    }catch(e){
        console.log('/getFileStorageCredentials catch error', e);
        return {
            error : {
                message : 'Failed to get storage credentials.'
            }
        }
    }
}