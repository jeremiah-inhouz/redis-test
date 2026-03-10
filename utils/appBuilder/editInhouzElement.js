const mongoose = require('mongoose');
const config = require('../../config/config')();
const _ = require('lodash');
const server = require('../../server');
const encryptDecrypt = require('../cryptography/encryptDecrypt');

module.exports = async (data={}, user={}, queueId='', decryptedCompanyId='') => {
    let appBlocked = false, appid='', InhouzAppCollection;
    try{
        const {
            elements=[], versionToUpdate=0, deletedElementIds=[],
            variationId='original', encryptedCompanyId='', appId=''
        } = data;

        //decrypt companyId
        let companyId;
        if(!decryptedCompanyId){
            companyId = encryptDecrypt(encryptedCompanyId);
        }else{
            companyId = decryptedCompanyId
        }
        
        if(
            !companyId ||
            !appId ||
            typeof appId !== 'string' ||
            typeof companyId !== 'string'
        ){
            return {
                error : {
                    message : 'Required elements are missing in update.'
                }
            }
        }

        const timestamp = data['timestamp'] || new Date().getTime();
        InhouzAppCollection = mongoose.model(config.inhouzAppModel);
        const AppElementUpdateQueueCollection = mongoose.model(config.appElementUpdateQueueModel);

        //check if item is queued and if queue has been processed
        if(queueId){
            let queueItem = await AppElementUpdateQueueCollection.findOne({
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
                let newQueueElement = await AppElementUpdateQueueCollection.create({
                    companyId,
                    appId,
                    elements,
                    variationId,
                    deletedElementIds,
                    timestamp,
                    versionToUpdate,
                    createdById : user['_id']
                })
                .catch(e => {
                    return {error : true}
                });

                if(newQueueElement && newQueueElement['error']){
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
            activeVersionMap={}
        } = inhouzApp;
        let activeVersion = activeVersionMap[variationId || 'original'];
        const AppElementCollection = mongoose.model(config.appElementModel);
        let nextVersion = activeVersion + 1, versionInFocus = versionToUpdate || activeVersion;
        let ignoredElementIds = [...deletedElementIds], newElements = [], error=false;

        for (let i = 0; i < elements.length; i++){
            let elementObj = elements[i];
            let {
                action='', element={}
            } = elementObj;
            
            if(element['_id']){
                delete element['_id'];
            }
            
            let newElement = await AppElementCollection.create({
                ...element,
                companyId,
                variationId,
                versionTracker : [nextVersion],
                createdDate : timestamp,
                createdById : user['_id'],
                editDate : timestamp,
                lastUpdatedById : user['_id']
            })
            .catch(e => {
                return false;
            });

            if(!newElement){
                error = true;
                break;
            }

            newElements.push(JSON.parse(JSON.stringify(newElement)));

            if(action === 'edit'){
                ignoredElementIds.push(element['elementId']);
            }
        }

        if(error){
            if(newElements.length > 0){
                await AppElementCollection.deleteMany({
                    _id : {
                        $in : newElements.map(element => element['_id'].toString())
                    },
                    companyId
                })
                .catch(e => {
                    return {deletedCount : 0}
                });
            }

            if(queueId){
                await AppElementUpdateQueueCollection.updateOne(
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
        versionUpdateResponse = await AppElementCollection.updateMany(
            {
                appId,
                companyId,
                versionTracker : versionInFocus,
                variationId,
                elementId : {
                    $nin : ignoredElementIds
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
            return {error : true}
        });

        if(versionUpdateResponse['error']){
            if(newElements.length > 0){
                await AppElementCollection.deleteMany({
                    _id : {
                        $in : newElements.map(element => element['_id'].toString())
                    },
                    companyId
                })
                .catch(e => {
                    return {deletedCount : 0}
                });
            }

            if(queueId){
                await AppElementUpdateQueueCollection.updateOne(
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

        //update pages
        const AppPageCollection = mongoose.model(config.appPageModel);
        let appPageUpdate = await AppPageCollection.updateMany(
            {
                appId,
                companyId,
                versionTracker : versionInFocus,
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

        if(!appPageUpdate['modifiedCount']){
            //revert element versions
            await AppElementCollection.updateMany(
                {
                    appId,
                    companyId,
                    versionTracker : versionInFocus,
                    variationId,
                    elementId : {
                        $nin : ignoredElementIds
                    }
                },
                {
                    $pull : {
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

            if(newElements.length > 0){
                await AppElementCollection.deleteMany({
                    _id : {
                        $in : newElements.map(element => element['_id'].toString())
                    },
                    companyId
                })
                .catch(e => {
                    return {deletedCount : 0}
                });
            }

            if(queueId){
                await AppElementUpdateQueueCollection.updateOne(
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

        //release app from hold and update to new version
        let appVersionUpdateResponse = await InhouzAppCollection.updateOne(
            {
                companyId,
                appId
            },
            {
                $set : {
                    transactionInProgress : false,
                    activeVersionMap : {
                        ...activeVersionMap,
                        [variationId || 'original'] : nextVersion
                    }
                }
            }
        )
        .catch(e => {
            return {modifiedCount : 0}
        });

        if(!appVersionUpdateResponse['modifiedCount']){
            //revert page versions 
            await AppPageCollection.updateMany(
                {
                    appId,
                    companyId,
                    versionTracker : versionInFocus,
                },
                {
                    $pull : {
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

            //revert element versions
            await AppElementCollection.updateMany(
                {
                    appId,
                    companyId,
                    versionTracker : versionInFocus,
                    variationId,
                    elementId : {
                        $nin : ignoredElementIds
                    }
                },
                {
                    $pull : {
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

            if(newElements.length > 0){
                await AppElementCollection.deleteMany({
                    _id : {
                        $in : newElements.map(element => element['_id'].toString())
                    },
                    companyId
                })
                .catch(e => {
                    return {deletedCount : 0}
                });
            }

            if(queueId){
                await AppElementUpdateQueueCollection.updateOne(
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

        //mark queued item as processed
        if(queueId){
            await AppElementUpdateQueueCollection.updateOne(
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

        //implement realtime updates
        let AppBuilderSocketTrackerCollection = mongoose.model(config.appBuilderSocketTrackerModel);
        let sockets = await AppBuilderSocketTrackerCollection.find({
            appId
        })
        .catch(e => {
            return false;
        });
        
        if(sockets){
            let socketIds = sockets.map(socket => socket['socketId']);
            for (let i = 0; i < socketIds.length; i++){
                let socketId = socketIds[i];
                server.getSocketIoInstance().sockets.to(socketId).emit('App builder update', {
                    elements : newElements,
                    nextVersion,
                    updatedById : user['_id'],
                    variationId,
                    versionToQuery : versionToUpdate,
                    appId,
                    success : true
                });
            }
        }

        // server.getSocketIoInstance().sockets.to(appId).emit('App builder update', {
        //     elements : newElements,
        //     nextVersion,
        //     updatedById : user['_id'],
        //     variationId,
        //     success : true
        // });

        return {
            success : true,
            addedToQueue : false,
            nextVersion,
            elements : newElements
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