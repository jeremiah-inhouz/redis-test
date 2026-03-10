const {Storage} = require('@google-cloud/storage');

module.exports = async (params={}) => {
    try{
        const {
            credentials={}, bucketName='',
            fileName=''
        } = params;
        const googleStorage = new Storage({
            credentials
        });
        let deleteResponse = await googleStorage.bucket(bucketName)
        .file(fileName)
        .delete()
        .catch(e => {
            console.log('/googleCloudDeleteFile deleteFail error', e.message);
            return {
                error : {
                    message : 'File deletion failed.'
                }
            }
        });

        if(deleteResponse['error']){
            return deleteResponse;
        }else{
            return {
                success : true
            }
        }
    }catch(e){
        console.log('/googleCloudDeleteFile deleteFile catch block error', e);
        return {
            error : {
                message : 'Failed to delete file from cloud storage location.'
            }
        }
    }
}