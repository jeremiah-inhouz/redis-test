const { BlobServiceClient } = require("@azure/storage-blob");
const {Buffer} = require('node:buffer');

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

        const downloadBlockBlobResponse = await blockBlobClient.download();
        const buffer = await (
            await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
        );
        let base64 = Buffer.from(buffer).toString('base64');
        
        return {
            base64
        }
    }catch(e){
        console.log('/azureDownloadFile catch block error', e);
        return {
            error : {
                message : 'Failed to download file from cloud storage location.'
            }
        }
    }
}

async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
  }