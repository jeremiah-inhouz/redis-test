const mongoose = require('mongoose');
const config = require('../../config/config')();
const _ = require('lodash');
const updateAppObject = require('./updateAppObject');

module.exports = async (
    appId='', companyId='', appObject,
    newElements=[], newPages=[], versionInFocus='',
    nextVersion='', variationId=''
) => {
    try{
        if(
            !appId ||
            !companyId ||
            typeof appId !== 'string' ||
            typeof companyId !== 'string'
        ){
            return {
                error : {
                    message : 'Required fields are missing.'
                }
            }
        }

        //roll back appObject updates
        await updateAppObject({
            ...appObject,
            transactionInProgress : false
        }, appId, companyId, true);

        //roll back element changes
        const AppElementCollection = mongoose.model(config.appElementModel);

        //delete new elements
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

        //roll back nextversion
        await AppElementCollection.updateMany(
            {
                appId,
                companyId,
                'versionTracker.version' : versionInFocus,
                variationId
            },
            {
                $pull : {
                    versionTracker : {version : nextVersion}
                }
            },
            {
                multi : true
            }
        )
        .catch(e => {
            return {modifiedCount : 0}
        });

        //roll back page changes
        const AppPageCollection = mongoose.model(config.appPageModel);
        //delete new pages
        await AppPageCollection.deleteMany({
            _id : {
                $in : newPages.map(page => page['_id'].toString())
            }
        })
        .catch(e => {
            return {deletedCount : 0}
        });

        //roll back next versioned pages
        await AppPageCollection.updateMany(
            {
                appId,
                companyId,
                'versionTracker.version' : versionInFocus,
                variationId
            },
            {
                $pull : {
                    versionTracker : {version : nextVersion}
                }
            },
            {
                multi : true
            }
        )
        .catch(e => {
            return {modifiedCount : 0}
        });

        return {success : true}
    }catch(e){
        console.log('/utils/appBuilder/editAppErrorHandling catch block error', e);
        return {
            error : {
                message : 'Failed to correct app update error'
            }
        }
    }
}