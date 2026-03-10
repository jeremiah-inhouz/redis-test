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

        let signedUrl = s3.getSignedUrl('getObject', {
            Bucket : credentials['awsBucketName'] || bucketName,
            Key : fileName,
            Expires : 604800 //1 week
        });

        return {
            fileUrl : signedUrl
        }
    }catch(e){
        console.log('/awsS3GenerateSignedUrl catch block error', e);
        return {
            error : {
                message : 'Failed to generate a pre-signed file url.'
            }
        }
    }
}