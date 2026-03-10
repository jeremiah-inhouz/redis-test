const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');
const {isEmpty} = require('lodash');
const parseFilter = require('../../../utils/filter/parseFilter');
const elementStylesFilterMap = require('../../../utils/appBuilder/elementStyles/filter/elementStylesFilterMap');
const elementStylesNonRegexList = require('../../../utils/appBuilder/elementStyles/filter/elementStylesNonRegexList');
const elementStylesTypeMap = require('../../../utils/appBuilder/elementStyles/filter/elementStylesTypeMap');

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
            filter, elementStylesFilterMap, 
            elementStylesNonRegexList, 
            elementStylesTypeMap
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
                    styleName : 1,
                    appId : 1,
                    companyId : 1,
                    isGlobal : 1,
                    styleArray : 1,
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

        const SavedStylesCollection = mongoose.model(config.savedAppStylesModel);
        let response = await SavedStylesCollection.aggregate(pipeline)
        
        let total_count = await SavedStylesCollection.countDocuments(parsedFilter)
        return res.send({
            results : response,
            total_count
        });
    }catch(e){
        console.log('/services/appBuilder/savedStyles/getSyles catch block error', e);
        return res.send({
            error : {
                message : 'An error occured while searching for apps.'
            }
        });
    }
}