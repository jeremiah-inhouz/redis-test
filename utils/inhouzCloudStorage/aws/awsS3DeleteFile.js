const AWS = require('aws-sdk');

module.exports = async (params={}) => {
    try{
        const {
            fileName='', 
            credentials={}, bucketName=''
        } = params;

        let s3 = new AWS.S3({
            accessKeyId : credentials['s3AccessKeyId'],
            secretAccessKey : credentials['s3SecretAccessKey'],
            region : credentials['awsRegion']
        });

        let deleteResponse = await s3.deleteObject({
            Bucket : credentials['awsBucketName'] || bucketName,
            Key : fileName
        })
        .promise()
        .then(() => {
            return {success : true};
        })
        .catch(e => {
            console.log('/awsS3DeleteFile deleteFile error', e);
            return {
                error : {
                    message : 'Failed to delete file.'
                }
            };
        }); 

        return deleteResponse;
    }catch(e){
        console.log('/awsS3DeleteFile catch block error', e);
        return {
            error : {
                message : 'Failed to delete file from cloud storage location.'
            }
        }
    }
}