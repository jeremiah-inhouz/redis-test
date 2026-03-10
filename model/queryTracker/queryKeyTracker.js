const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const queryKeyTrackerSchema = new Schema({
    key : {
        type : String,
        required : true
    },
    timestamp : {
        type : Number,
        required : true
    }
}, {
    timestamps : true,
    strict : true
});

queryKeyTrackerSchema.index({
    key : 1, timestamp : 1
});

module.exports = mongoose.model(config.queryKeyTrackerModel, queryKeyTrackerSchema, config.queryKeyTrackerModel);