const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async (params={}) => {
    try{
        const {
            credentials={}, toFileName='',
            fromFileName=''
        } = params;

        //get source
        const blobServiceClient = new BlobServiceClient(credentials['azureBlobSasUrl']);
        const fromContainerClient = blobServiceClient.getContainerClient('');
        const fromSourceClient = fromContainerClient.getBlockBlobClient(fromFileName);
        let sourceUrl = fromSourceClient.url;

        const toContainerClient = blobServiceClient.getContainerClient('');
        const toDestinationClient = toContainerClient.getBlockBlobClient(toFileName);

        const copyPoller = await toDestinationClient.beginCopyFromURL(sourceUrl);
        const result = await copyPoller.pollUntilDone()
        .then(() => {
            return {
                success : true
            }
        })
        .catch((e) => {
            console.log('/azureCopyFile copy error', e.message);
            return {
                error : {
                    message : e.message
                }
            }
        });

        return result;
    }catch(e){
        console.log('/azureCopyFile catch block error', e);
        return {
            error : {
                message : 'Failed to delete file from cloud storage location.'
            }
        }
    }
}