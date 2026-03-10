const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const parseFilter = require('../../../utils/filter/parseFilter');
const savedAppElementsFilterMap = require('../../../utils/appBuilder/element/filter/savedAppElementsFilterMap');
const savedAppElementNonRegexList = require('../../../utils/appBuilder/element/filter/savedAppElementNonRegexList');
const savedAppElementTypeMap = require('../../../utils/appBuilder/element/filter/savedAppElementTypeMap');
const {isEmpty} = require('lodash');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            filter={}, sort={}, skip=0, limit=0, useQuery=false,
            query={}
        } = reqBody;
        if(
            !filter['companyId'] ||
            typeof filter['companyId'] !== 'string' ||
            !mongoose.Types.ObjectId.isValid(filter['companyId'])
        ){
            return res.send({error : {
                message : 'Invalid request. Required fields are missing'
            }});
        }

        let parsedFilter = useQuery ? query : parseFilter(
            filter, savedAppElementsFilterMap, 
            savedAppElementNonRegexList, 
            savedAppElementTypeMap
        );

        let pipeline = [
            {
                $match : {
                    companyId : filter['companyId']
                }
            },
            {
                $lookup : {
                    from : 'users',
                    let: {userId : "$lastUpdatedById"},
                    pipeline : [
                        {
                            $match : {
                                $expr : {
                                    $eq : [
                                        {
                                            $toString : '$_id'
                                        },
                                        "$$userId"
                                    ]
                                }
                            }
                        }
                    ],
                    as : 'user'
                }
            },
            {
                $unwind : {
                    path : '$user',
                    preserveNullAndEmptyArrays : true
                }
            },
            {
                $addFields : {
                    usersName : {
                        $concat : ['$user.firstName', ' ', '$user.lastName']
                    }
                }
            },
            {
                $match : parsedFilter
            },
            {
                $project : {
                    _id : 1,
                    name : 1,
                    appId : 1,
                    companyId : 1,
                    isGlobal : 1,
                    elementType : 1,
                    cloneType : 1,
                    referenceElementId : 1,
                    compressedDeepCopy : 1,
                    createDate : 1,
                    createdById : 1,
                    editDate : 1,
                    lastUpdatedById : 1,
                    usersName : 1
                }
            }
        ]

        if(!isEmpty(sort)){
            pipeline.push({
                $sort : sort
            });
        }
        if(skip){
            pipeline.push({
                $skip : Number(skip)
            })
        }
        if(limit){
            pipeline.push({
                $limit : Number(limit)
            })
        }

        const SaveAppElementCollection = mongoose.model(config.savedAppElementModel);
        let response = await SaveAppElementCollection.aggregate(pipeline);
        let total_count = await SaveAppElementCollection.countDocuments(parsedFilter)
        return res.send({
            results : response,
            total_count
        });
    }catch(e){
        console.log('/services/appBuilder/elements/getSavedAppElements catch error', e);
        return res.send({
            error : {
                message : 'Failed to get saved app elements.'
            }
        });
    }
}