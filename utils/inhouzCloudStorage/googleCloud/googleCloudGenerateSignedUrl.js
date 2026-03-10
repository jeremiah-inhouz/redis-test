const {Storage} = require('@google-cloud/storage');

module.exports = async (params={}) => {
    try{
        const {
            credentials={}, bucketName='', 
            fileName='', expirationTimestamp=0
        } = params;

        const googleStorage = new Storage({
            credentials
        });

        const options = {
            version: 'v2', // defaults to 'v2' if missing.
            action: 'read',
            expires: expirationTimestamp || Date.now() + 1000 * 60 * 60 * 24, // 24 hours
        };

        const signedUrlResponse = await googleStorage
        .bucket(bucketName)
        .file(fileName)
        .getSignedUrl(options)
        .catch(e => {
            console.log('/googleCloudGenerateSignedUrl getSignedUrl error', e.message);
            return {
                error : {
                    message : 'Failed to get signed URL.'
                }
            }
        });

        if(Array.isArray(signedUrlResponse) && signedUrlResponse[0]){
            return {
                fileUrl : signedUrlResponse[0]
            }
        }else{
            return signedUrlResponse;
        }
    }catch(e){
        console.log('/googleCloudGenerateSignedUrl catch block error', e);
        return {
            error : {
                message : 'Failed to generate signed url.'
            }
        }
    }
}