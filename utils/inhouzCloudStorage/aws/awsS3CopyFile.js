const AWS = require('aws-sdk');

module.exports = async (params={}) => {
    try{
        const {
            credentials={}, toFileName='', toBucketName='',
            fromFileName='', fromBucketName=''
        } = params;

        let s3 = new AWS.S3({
            accessKeyId : credentials['s3AccessKeyId'],
            secretAccessKey : credentials['s3SecretAccessKey'],
            region : credentials['awsRegion']
        });

        let s3Params = {
            Bucket : toBucketName,
            Key : toFileName,
            CopySource : `/${fromBucketName}/${fromFileName}`
        }

        let copyResponse = await s3.copyObject(s3Params)
        .promise()
        .then(() => {
            return {
                success : true
            }
        })
        .catch((e) => {
            console.log('/awsS3CopyFile copyError', e);
            return {
                error : {
                    message : e.message
                }
            }
        });

        return copyResponse;
    }catch(e){
        console.log('/awsS3CopyFile catch block error', e);
        return {
            error : {
                message : 'Failed to copy file from cloud storage location.'
            }
        }
    }
}