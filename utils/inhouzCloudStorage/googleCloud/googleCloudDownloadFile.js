const {Storage} = require('@google-cloud/storage');
const {Buffer} = require('node:buffer');

module.exports = async (params={}) => {
    try{
        const {
            credentials={}, bucketName='',
            fileName=''
        } = params;
        const googleStorage = new Storage({
            credentials
        });

        const myBucket = googleStorage.bucket(bucketName);
        const file = myBucket.file(fileName);
        let downloadedFile = await file.download()
        .then((data) => {
            let contents = data[0]; 
            return {
                base64 : Buffer.from(contents).toString('base64')
            };
        })
        .catch(e => {
            console.log('/googleCloudDownloadFile downloadFileError', e.message);
            return {
                error : {
                    message : 'Failed to download file.'
                }
            }
        });

        return downloadedFile;
    }catch(e){
        console.log('/googleCloudDownloadFile catch block error', e);
        return {
            error : {
                message : 'Failed to download file from cloud storage location.'
            }
        }
    }
}