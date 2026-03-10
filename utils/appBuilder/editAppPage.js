const mongoose = require('mongoose');
const config = require('../../config/config')();
const _ = require('lodash');

module.exports = async (data={}, user={}, queueId='') => {
    let appBlocked = false, appid='', InhouzAppCollection;
    try{
        const {
            page={}, action='', versionToUpdate=0
        } = data;
        const {
            appId='', companyId='', pageId='', versionTracker=[]
        } = page;

        const timestamp = data['timestamp'] || new Date().getTime();

        if(
            !appId ||
            !companyId ||
            !pageId ||
            !action ||
            typeof action !== 'string' ||
            typeof appId !== 'string' ||
            typeof companyId !== 'string' ||
            typeof pageId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(companyId)
        ){
            return {
                error : {
                    message : 'Required elements are missing in update.'
                }
            }
        }

        InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        const PageUpdateQueueCollection = mongoose.model(config.pageUpdateQueueModel);

        //check if item is queued and if queue has been processed
        if(queueId){
            let queueItem = await PageUpdateQueueCollection.findOne({
                _id : queueId,
                processed : false
            })
            .lean()
            .catch(e => {
                return false
            });

            if(!queueItem){
                return {
                    parsed : true
                }
            }
        }

        //mark app as transaction in progress
        const inProgressResponse = await InhouzAppCollection.updateOne(
            {
                companyId,
                appId,
                transactionInProgress : false
            },
            {
                $set : {
                    transactionInProgress : true
                }
            }
        )
        .catch(e => {
            return {modifiedCount : 0}
        });

        if(
            !inProgressResponse['modifiedCount']
        ){
            if(queueId){
                return {
                    transactionInProgress : true
                }
            }else{
                let newQueuePage = await PageUpdateQueueCollection.create({
                    companyId,
                    appId,
                    pageId,
                    action,
                    page,
                    timestamp,
                    versionToUpdate,
                    createdById : user['_id']
                })
                .catch(e => {
                    return {error : true}
                });

                if(newQueuePage && newQueuePage['error']){
                    return {
                        error : {
                            message : 'App update failed'
                        }
                    }
                }else{
                    return {
                        addedToQueue : true
                    }
                }
            }
        }

        appBlocked = true, appid = appId;
        //get app object
        const inhouzApp = await InhouzAppCollection.findOne({
            companyId,
            appId
        })
        .lean()
        .catch(e => {
            return false
        });

        if(!inhouzApp){
            await InhouzAppCollection.updateOne(
                {
                    companyId,
                    appId
                },
                {
                    $set : {
                        transactionInProgress : false
                    }
                }
            )
            .catch(e => {
                return {modifiedCount : 0}
            });

            return {
                error : {
                    message : 'App was not found.'
                }
            }
        }

        let {
            activeVersion=0
        } = inhouzApp;

        const AppPageCollection = mongoose.model(config.appPageModel);
        let newPage, nextVersion=activeVersion + 1, 
        versionInFocus = versionToUpdate || activeVersion;
        if(['create'].includes(action)){
            newPage = await AppPageCollection.create({
                ...page,
                versionTracker : [nextVersion],
                createdDate : timestamp,
                createdById : user['_id'],
                editDate : timestamp,
                lastUpdatedById : user['_id']
            })
            .catch(e => {
                return false;
            });
        }else if(action === 'edit'){
            let oldPage = await AppPageCollection.findOne({
                companyId,
                appId,
                versionTracker : versionInFocus,
                pageId
            })
            .lean()
            .catch(e => {
                return false;
            });

            let oldPageCopy = (
                oldPage && 
                JSON.parse(JSON.stringify(oldPage))
            ) || false;

            newPage = await AppPageCollection.create({
                ...page,
                versionTracker : oldPageCopy && oldPageCopy['versionTracker'] ? 
                [...oldPageCopy['versionTracker'], nextVersion] : [...versionTracker, nextVersion],
                editDate : timestamp,
                lastUpdatedById : user['_id']
            })
            .catch(e => {
                return false;
            });
        }

        if(!newPage || !newPage['_id']){
            if(queueId){
                await PageUpdateQueueCollection.updateOne(
                    {
                        _id : queueId
                    },
                    {
                        $set : {
                            processed : true
                        }
                    }
                )
                .catch(e => {
                    return {modifiedCount : 0}
                })
            }

            await InhouzAppCollection.updateOne(
                {
                    companyId,
                    appId
                },
                {
                    $set : {
                        transactionInProgress : false
                    }
                }
            )
            .catch(e => {
                return {modifiedCount : 0}
            });

            return {
                error : {
                    message : 'App update failed.'
                }
            }
        }

        //update every current element to the next version
        let versionUpdateResponse;
        if(nextVersion !== 1){
            let ignoredPages = [pageId];
            versionUpdateResponse = await AppPageCollection.updateMany(
                {
                    appId,
                    companyId,
                    versionTracker : versionInFocus,
                    pageId : {
                        $nin : ignoredPages
                    }
                },
                {
                    $push : {
                        versionTracker : nextVersion
                    }
                },
                {
                    multi : true
                }
            )
            .catch(e => {
                return {modifiedCount : 0}
            });

            if(!versionUpdateResponse['modifiedCount']){
                if(queueId){
                    await PageUpdateQueueCollection.updateOne(
                        {
                            _id : queueId
                        },
                        {
                            $set : {
                                processed : true
                            }
                        }
                    )
                    .catch(e => {
                        return {modifiedCount : 0}
                    })
                }

                //delete page
                await AppPageCollection.deleteOne({
                    companyId,
                    _id : newPage['_id'].toString()
                })
                .catch(e => {
                    return {deletedCount : 0}
                });

                await InhouzAppCollection.updateOne(
                    {
                        companyId,
                        appId
                    },
                    {
                        $set : {
                            transactionInProgress : false
                        }
                    }
                )
                .catch(e => {
                    return {modifiedCount : 0}
                });

                return {
                    error : {
                        message : 'App update failed.'
                    }
                }
            }
        }

        await InhouzAppCollection.updateOne(
            {
                companyId,
                appId
            },
            {
                $set : {
                    transactionInProgress : false,
                    activeVersion : nextVersion
                }
            }
        )
        .catch(e => {
            return {modifiedCount : 0}
        });

        if(queueId){
            await PageUpdateQueueCollection.updateOne(
                {
                    _id : queueId
                },
                {
                    $set : {
                        processed : true
                    }
                }
            )
            .catch(e => {
                return {modifiedCount : 0}
            });
        }

        return {
            success : true,
            addedToQueue : false,
            nextVersion,
            page : newPage ? JSON.parse(JSON.stringify(newPage)) : {}
        }
    }catch(e){
        console.log('/utils/appBuilder/editInhouzElements catch error', e);
        if(appBlocked){
            await InhouzAppCollection.updateOne(
                {
                    appId : appid
                },
                {
                    $set : {
                        transactionInProgress : false
                    }
                }
            )
            .catch(e => {
                return {modifiedCount : 0}
            });
        }
        return {
            error : {
                message : 'App update failed.'
            }
        }
    }
}