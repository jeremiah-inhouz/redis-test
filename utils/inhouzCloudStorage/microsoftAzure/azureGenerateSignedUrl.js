const { 
    BlobServiceClient, StorageSharedKeyCredential,
    BlobSASPermissions
} = require("@azure/storage-blob");

module.exports = async (params={}) => {
    try{
        const {
            fileName='',
            credentials={},
            expirationTimestamp=0
        } = params;

        // console.log('sas url', credentials['azureBlobSasUrl'])
        let containerName = credentials['azureContainerName'];
        if(!credentials['azureBlobSasUrl']){
            return {
                error : {
                    message : 'Invalid file storage credentials'
                }
            }
        }
        let accountName = credentials['azureBlobSasUrl'].split('://')[1].split('.')[0];
        let accountKey = credentials['azureStorageAccountKey'];
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential
        );
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        let url = await blockBlobClient.generateSasUrl({
            startsOn: new Date(),
            expiresOn : new Date(expirationTimestamp || (new Date().valueOf() + 86400000)),
            permissions : BlobSASPermissions.parse("racwd"),
            
        });
        
        return {
            fileUrl : url
        }
    }catch(e){
        console.log('/azureGenerateSignedUrl catch block error', e);
        return {
            error : {
                message : 'Failed to generate a signed URL of file.'
            }
        }
    }
}