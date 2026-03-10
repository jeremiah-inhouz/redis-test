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

        let downloadResponse = await s3.getObject({
            Bucket : credentials['awsBucketName'] || bucketName,
            Key : fileName
        })
        .promise()
        .then((data) => {
            let base64 = data.Body.toString('base64');
            return {
                base64
            }
        })
        .catch((e) => {
            console.log('/awsS3DownloadFile download error', e.message);
            return {
                error : {
                    message : e.message
                }
            }
        });

        // let client = new S3Client({
        //     accessKeyId : credentials['s3AccessKeyId'],
        //     secretAccessKey : credentials['s3SecretAccessKey'],
        //     region : credentials['awsRegion']
        // });

        // const command = new GetObjectCommand({
        //     Bucket: credentials['awsBucketName'] || bucketName,
        //     Key: fileName
        // });

        // const response = await client.send(command);
        // let base64 = await response.Body.transformToString();
        return downloadResponse
    }catch(e){
        console.log('/awsS3DownloadFile catch block error', e);
        return {
            error : {
                message : 'Failed to download file from cloud storage location.'
            }
        }
    }
}