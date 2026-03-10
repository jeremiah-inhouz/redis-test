const AWS = require('aws-sdk');

module.exports = async (params={}) => {
    try{
        const {
            fileName='', base64='', 
            credentials={}, bucketName='',
            fileType=''
        } = params;

        let s3 = new AWS.S3({
            accessKeyId : credentials['s3AccessKeyId'],
            secretAccessKey : credentials['s3SecretAccessKey'],
            region : credentials['awsRegion']
        });

        var bufferedFile = Buffer.from(base64.split('base64,')[1],'base64');
        let uploadObject = {
            Bucket : credentials['awsBucketName'] || bucketName,
            Key : fileName,
            Body : bufferedFile,
            contentEncoding : 'base64',
            contentType : fileType
        }

        let s3Response = await s3.upload(uploadObject, {})
        .promise()
        .then(() => {
            return {
                success : true
            };
        })
        .catch((err) => {
            console.log('/awsS3FileUpload s3.upload catch error', err)
            return {
                error : {
                    message : 'File upload failed.'
                }
            }
        });

        return s3Response;
    }catch(e){
        console.log('/awsS3FileUpload catch block error', e);
        return {
            error : {
                message : 'Failed to upload file to cloud storage location.'
            }
        }
    }
}