const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../../utils/sanitizer/recursiveSanitizer');
const config = require('../../../config/config')();
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            appId=''
        } = reqBody;
        if(
            !appId ||
            typeof appId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(appId)
        ){
            return res.send({
                error : {
                    message : 'Invalid request. Required parameters are missing.'
                }
            });
        }

        const InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        const existingApp = await InhouzAppCollection.findOne({
            appId
        })
        .lean()
        .catch(e => {
            return false;
        });

        if(!existingApp){
            return res.send({
                error : {
                    message : 'App was not found.'
                }
            });
        }

        const StyleGuideCollection = mongoose.model(config.styleGuideModel);
        const guides = await StyleGuideCollection.aggregate([
            {
                $match : {
                    appId,
                    companyId : existingApp['companyId']
                }
            },
            {
                $lookup : {
                    from : config.savedAppStylesModel,
                    let: {
                        savedStyleId : "$savedStyleId"
                    },
                    pipeline : [
                        {
                            $match : {
                                $expr : {
                                    $eq : [
                                        {
                                            $toString : '$_id'
                                        },
                                        "$$savedStyleId"
                                    ]
                                }
                            }
                        }
                    ],
                    as : 'savedAppStyle'
                }
            },
            {$unwind : {
                path : '$savedAppStyle',
                preserveNullAndEmptyArrays : true
            }},
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
                    path : '$editor',
                    preserveNullAndEmptyArrays : true
                }
            },
            {
                $addFields : {
                    styleArray : "$savedAppStyle.styleArray",
                    styleName : "$savedAppStyle.styleName",
                    usersName : {
                        $concat : ['$editor.firstName', ' ', '$editor.lastName']
                    }
                }
            },
            {
                $project : {
                    companyId : 1,
                    appId : 1,
                    elementType : 1,
                    savedStyleId : 1,
                    active : 1,
                    lastUpdatedById : 1,
                    createdDate : 1,
                    createdById : 1,
                    editDate : 1,
                    styleArray : 1,
                    styleName : 1,
                    usersName : 1
                }
            }
        ]);

        return res.send({
            results : guides
        });
    }catch(e){
        console.log('/services/appBuilder/styleGuide/getStyleGuide catch error', e);
        return res.send({
            error : {
                message : 'An error occured while getting app style guide.'
            }
        });
    }
}