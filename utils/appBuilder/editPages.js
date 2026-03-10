const mongoose = require('mongoose');
const config = require('../../config/config')();
const _ = require('lodash');

module.exports = async (data={}, inhouzApp={}, companyId='', user={}) => {
    try{
        const {
            pages=[], deletedPageIds=[], versionToUpdate=0,
            variationId='original', appId=''
        } = data;
        const timestamp = data['timestamp'] || new Date().getTime();
        let {
            activeVersionMap={}
        } = inhouzApp;
        let activeVersion = activeVersionMap[variationId || 'original'];

        const AppPageCollection = mongoose.model(config.appPageModel);
        let newPages=[], nextVersion=activeVersion + 1, versionInFocus = versionToUpdate || activeVersion,
        ignoredPageIds = [...deletedPageIds], error=false,
        newPageList=[], processedPages={};

        for (let i = 0; i < pages.length; i++){
            let pageObject = pages[i];
            let {
                action='', page={}
            } = pageObject;

            if(processedPages[page['pageId']]){
                continue;
            }

            if(page['_id']){
                delete page['_id'];
            }

            // let newPage = await AppPageCollection.create({
            //     ...page,
            //     appType : inhouzApp['appType'],
            //     appId : inhouzApp['appId'],
            //     companyId,
            //     variationId,
            //     versionTracker : [{version : nextVersion}],
            //     createdDate : timestamp,
            //     createdById : user['_id'],
            //     editDate : timestamp,
            //     lastUpdatedById : user['_id']
            // })
            // .catch(e => {
            //     console.log('create in edit page mongo error', e)
            //     return false;
            // });

            // if(!newPage){
            //     error = true;
            //     break;
            // }

            // newPages.push(JSON.parse(JSON.stringify(newPage)));

            newPageList.push({
                ...page,
                appType : inhouzApp['appType'],
                appId : inhouzApp['appId'],
                companyId,
                variationId,
                versionTracker : [{version : nextVersion}],
                createdDate : timestamp,
                createdById : user['_id'],
                editDate : timestamp,
                lastUpdatedById : user['_id']
            });

            if(action === 'edit'){
                ignoredPageIds.push(page['pageId']);
            }

            processedPages[page['pageId']] = true;
        }

        newPages = await AppPageCollection.insertMany(newPageList)
        .catch(e => {
            console.log('/editPages create newPages mongo error', e);
            return {error : true}
        });

        if(newPages['error']){
            error = true;
        }

        if(error){
            if(newPageList.length > 0){
                // await AppPageCollection.deleteMany({
                //     _id : {
                //         $in : newPages.map(page => page['_id'].toString())
                //     }
                // })
                // .catch(e => {
                //     console.log('/editPage deletePages mongo error', e);
                //     return {deletedCount : 0}
                // });

                return {
                    error : {
                        message : 'App update failed',
                        errorPayload : 'Failed to create new page(s).'
                    }
                }
            }
        }

        //update every current page to the next version
        let versionUpdateResponse = await AppPageCollection.updateMany(
            {
                appId,
                companyId,
                'versionTracker.version' : versionInFocus,
                variationId,
                pageId : {
                    $nin : ignoredPageIds
                }
            },
            {
                $push : {
                    versionTracker : {version : nextVersion}
                }
            }
        )
        .catch(e => {
            console.log('/editPages failed to update appPage versions.', e);
            return {error : true}
        });

        if(versionUpdateResponse['error']){
            if(newPages.length > 0){
                await AppPageCollection.deleteMany({
                    _id : {
                        $in : newPages.map(page => page['_id'].toString())
                    }
                })
                .catch(e => {
                    console.log('/editPages deletePages after failed version update mongo error', e);
                    return {deletedCount : 0}
                });
            }

            return {
                error : {
                    message : 'App update failed.',
                    errorPayload : 'Failed to update existing pages to the next version'
                }
            }
        }

        return {
            success : true,
            nextVersion,
            pages : newPages
        }
    }catch(e){
        console.log('/utils/appBuilder/editPages catch error', e);
        return {
            error : {
                message : 'App update failed.',
                errorPayload : 'Edit pages catch block error'
            }
        }
    }
}