const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async (params={}) => {
    try{
        const {
            fileName='', 
            credentials={}
        } = params;

        let containerName = credentials['azureContainerName'];
        const blobServiceClient = new BlobServiceClient(credentials['azureBlobSasUrl']);
        const containerClient = blobServiceClient.getContainerClient('');
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        let deleteResponse = await blockBlobClient.delete({deleteSnapshots : 'include'})
        .then(() => {
            return {
                success : true
            }
        })
        .catch((e) => {
            console.log('/azureDeleteFiles delete error', e.message);
            return {
                error : {
                    message : e.message
                }
            }
        });

        return deleteResponse
    }catch(e){
        console.log('/azureDeleteFile catch block error', e);
        return {
            error : {
                message : 'Failed to delete file from cloud storage location.'
            }
        }
    }
}