const { BlobServiceClient } = require("@azure/storage-blob");
const {Buffer} = require('node:buffer');

module.exports = async (params={}) => {
    try{
        const {
            fileName='', base64='', 
            credentials={},
            fileType=''
        } = params;

        let containerName = credentials['azureContainerName'];
        const blobServiceClient = new BlobServiceClient(credentials['azureBlobSasUrl']);
        const containerClient = blobServiceClient.getContainerClient('');
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        let strippeedBase64 = base64.split('base64,')[1];
        let arrayBuffer = Buffer.from(strippeedBase64, 'base64');

        let uploadResponse = await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength)
        .then(() => {
            return {
                success : true
            };
        })
        .catch(e => {
            console.log('/azureFileUpload uploadError', e.message);
            return {
                error : {
                    message : e.message
                }
            }
        });

        if(uploadResponse['success']){
            await blockBlobClient.setHTTPHeaders({blobContentType : fileType})
        }
        return uploadResponse
    }catch(e){
        console.log('/azureFileUpload catch block error', e);
        return {
            error : {
                message : 'Failed to upload file to cloud storage location.'
            }
        }
    }
}