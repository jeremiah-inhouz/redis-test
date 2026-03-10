const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');
const filterMap = require('../../utils/appBuilder/getApps/filter/filterMap');
const typeMap = require('../../utils/appBuilder/getApps/filter/typeMap');
const nonRegexMap = require('../../utils/appBuilder/getApps/filter/nonRegexMap');
const parseFilter = require('../../utils/filter/parseFilter');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            filter={}, sort={}, skip=0, limit=0, 
            thirdParty=false, excludeNonWebAppTypes=false
        } = reqBody;
        if(!thirdParty){
            filter['companyId'] = req.user['companyId'];
        }
        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);

        if(filter['deployed']){
            filter['deployed'] = filter['deployed'] === 'true' ? true : false;
        }
        let parsedFilter = parseFilter(
            filter, filterMap, nonRegexMap, typeMap
        );

        if(thirdParty){
            parsedFilter = {
                ...parsedFilter,
                'settings.shareWithExternalUsers' : true,
                'settings.externalUsers.email' : req.user['email']
            }
        }

        if(excludeNonWebAppTypes){
            if(!parsedFilter['appType']){
                parsedFilter['appType'] = {
                    $in : ['webApp', 'webComponent']
                }
            }else{
                if(!['webApp', 'webComponent'].includes(parsedFilter['appType'])){
                    parsedFilter['appType'] = {
                        $in : ['webApp', 'webComponent']
                    }
                }
            }
        }
        
        let basePipeline;
        if(thirdParty){
            basePipeline = [
                {
                    $project : {
                        _id : 1,
                        appName : 1,
                        companyId : 1,
                        subDomain : 1,
                        description : 1,
                        folderId : 1,
                        appId : 1,
                        appType : 1,
                        createdDate : 1,
                        createdById : 1,
                        editDate : 1,
                        lastUpdatedById : 1,
                        deployed : 1,
                        createdByUsersName : 1,
                        editedByUsersName : 1,
                        settings : 1
                    }
                },
                {
                    $match : parsedFilter
                }
            ];
        }else{
            basePipeline = [
                {
                    $match : {
                        companyId : filter['companyId']
                    }
                },
                {
                    $lookup : {
                        from : 'users',
                        let: {userId : "$createdById"},
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
                        as : 'creator'
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
                        as : 'editor'
                    }
                },
                {
                    $unwind : {
                        path : '$creator',
                        preserveNullAndEmptyArrays : true
                    }
                },
                {
                    $unwind : {
                        path : '$editor',
                        preserveNullAndEmptyArrays : true
                    }
                },
                {
                    $addFields : {
                        createdByUsersName : {
                            $concat : ['$creator.firstName', ' ', '$creator.lastName']
                        },
                        editedByUsersName : {
                            $concat : ['$editor.firstName', ' ', '$editor.lastName']
                        }
                    }
                },
                {
                    $project : {
                        _id : 1,
                        appName : 1,
                        companyId : 1,
                        subDomain : 1,
                        description : 1,
                        folderId : 1,
                        appId : 1,
                        appType : 1,
                        createdDate : 1,
                        createdById : 1,
                        editDate : 1,
                        lastUpdatedById : 1,
                        deployed : 1,
                        createdByUsersName : 1,
                        editedByUsersName : 1,
                        settings : 1
                    }
                },
                {
                    $match : parsedFilter
                }
            ];
        }

        let detailPipeline = JSON.parse(JSON.stringify(basePipeline));
        if(!_.isEmpty(sort)){
            detailPipeline.push({
                $sort : sort
            });
        }
        if(skip){
            detailPipeline.push({
                $skip : Number(skip)
            })
        }
        if(limit){
            detailPipeline.push({
                $limit : Number(limit)
            })
        }

        let apps = await InhouzAppCollection.aggregate(detailPipeline);
        let total_count = await InhouzAppCollection.aggregate([
            ...basePipeline,
            {
                $count : 'count'
            }
        ]);

        return res.send({
            results : apps,
            total_count : (total_count[0] && total_count[0]['count']) || 0
        });
    }catch(e){
        console.log('/services/appBuilder/getApps catch block error', e);
        return res.send({
            error : {
                message : 'An error occured while searching for apps.'
            }
        });
    }
}