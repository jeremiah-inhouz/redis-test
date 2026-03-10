const {Storage} = require('@google-cloud/storage');
const { Buffer } = require('node:buffer');

module.exports = async (params={}) => {
    try{
        const {
            credentials={}, bucketName='', base64='', 
            fileName='', fileType=''
        } = params;

        let strippedBase64String = base64.split('base64,')[1];
        let fileBuffer = Buffer.from(strippedBase64String, 'base64');

        const googleStorage = new Storage({
            credentials
        });

        let myBucket = googleStorage.bucket(bucketName);
        let file = myBucket.file(fileName);

        let result = await file.save(
            fileBuffer,
            {
                metadata: { contentType: fileType },
                // public: true,
                validation: 'md5'
            }
        )
        .then(() => {
            return {
                success : true,
                fileName
            }
        })
        .catch(err => {
            console.log('err', err.message);
            return {
                error : {
                    message : err.message
                }
            }
        });

        return result;
    }catch(e){
        console.log('/googleCloudUploadFile catch block error', e);
        return {
            error : {
                message : 'Failed to upload file to cloud storage location.'
            }
        }
    }
}