const {Storage} = require('@google-cloud/storage');

module.exports = async (params={}) => {
    try{
        const {
            credentials={}, toFileName='', toBucketName='',
            fromFileName='', fromBucketName=''
        } = params;

        const googleStorage = new Storage({
            credentials
        });

        let copyDestination = googleStorage.bucket(toBucketName).file(toFileName);
        let copyResponse = await googleStorage.bucket(fromBucketName)
        .file(fromFileName)
        .copy(copyDestination)
        .catch(e => {
            console.log('/googleCloudCopyFile copyFile error', e.message);
            return {
                error : {
                    message : 'An error occurred while copying file.'
                }
            }
        });

        if(copyResponse['error']){
            return copyResponse;
        }else{
            return {
                success : true
            }
        }
    }catch(e){
        console.log('/googleCloudCopyFile catch block error', e);
        return {
            error : {
                message : 'Failed to copy File.'
            }
        }
    }
}