const config = require('../../config/config')();
const mongoose = require('mongoose');

module.exports = async (queryKey) => {
    try{
        const QueryTrackerCollection = mongoose.model(config.queryKeyTrackerModel);
        let existingKey = await QueryTrackerCollection.findOne({
            key : queryKey
        })
        .lean()
        .catch(e => {
            console.log('/utils/query/validateQueryKey get existingKey mongo error', e);
            return {error : true}
        });

        if(existingKey && existingKey['error']){
            return res.status(500).send({
                error : {
                    message : 'An error occurred while validating access key.'
                }
            });
        }

        if(existingKey){
            return {
                error : {
                    message : 'Expired authorization token.'
                }
            };
        }

        //cache current key
        QueryTrackerCollection.create({
            key : queryKey,
            timestamp : new Date().getTime()
        })
        .catch(e => {
            console.log('/utils/query/validateQueryKey cache queryTracker mongo error', e);
            return;
        });

        return {success : true}
    }catch(e){
        console.log('/utils/query/validateQueryKey catch block error', e);
        return {
            error : {
                message : 'An error occured while validating query key'
            }
        }
    }
}