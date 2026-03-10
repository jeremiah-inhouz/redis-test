const mongoose = require('mongoose');
const divInitObject = require('../../element/body/divInitObject');
const config = require('../../../config/config')();

module.exports = async (params={}, req) => {
    try{
        const {
            isRootPage=false,
            is404Page=false,
            routePath='',
            appId='',
            timestamp=0,
            appType='',
            pageName=''
        } = params;

        if(
            !appId ||
            !appType ||
            !pageName ||
            typeof appId !== 'string' ||
            typeof appType !== 'string' ||
            typeof pageName !== 'string'
        ){
            return {
                error : {
                    message : 'Required fields are missing.'
                }
            }
        }

        const AppPageCollection = mongoose.model(config.appPageModel);
        //get pageId
        let pageId = new mongoose.Types.ObjectId().toHexString(), keyAvailable=false,
        errorGettingKey=false;
        while (!keyAvailable && !errorGettingKey){
            let appKey = await AppPageCollection.findOne({
                pageId
            })
            .catch(e => {
                return {
                    error : {
                        message : 'An error occured while finding page',
                        errorPayload : e
                    }
                }
            });

            if(
                appKey && 
                appKey['error']
            ){
                errorGettingKey = true;
            }

            if(!appKey || _.isEmpty(appKey)){
                keyAvailable = true;
            }

            if(appKey && appKey['_id']){
                pageId = new mongoose.Types.ObjectId().toHexString();
            }
        }

        if(errorGettingKey){
            return res.send({
                error : {
                    message : 'An error occured while initializing the app.'
                }
            });
        }

        let newPage = await AppPageCollection.create({
            pageId,
            appType,
            pageName,
            appId,
            isRootPage,
            is404Page,
            pageNumber : isRootPage ? 1 : 2,
            slug : routePath,
            companyId : req.user['companyId'],
            createdDate : timestamp,
            createdById : req.user['_id'].toString(),
            editDate : timestamp,
            lastUpdatedById : req.user['_id'].toString(),
            versionTracker : [{version : 0}]
        })
        .catch(e => {
            return {error : true}
        });

        if(
            !newPage ||
            (
                newPage && 
                !newPage['_id']
            ) ||
            (
                newPage && 
                newPage['error']
            )
        ){
            return {
                error : {
                    message : 'Failed to create app page.'
                }
            }
        }

        //create root element
        const AppElementCollection = mongoose.model(config.appElementModel);
        //get elementId
        let elementId = new mongoose.Types.ObjectId().toHexString(), keyIsAvailable=false,
        errorGettingId=false;
        while (!keyIsAvailable && !errorGettingId){
            let appKey = await AppElementCollection.findOne({
                elementId
            })
            .catch(e => {
                return {
                    error : {
                        message : 'An error occured while finding page',
                        errorPayload : e
                    }
                }
            });

            if(
                appKey && 
                appKey['error']
            ){
                errorGettingId = true;
            }

            if(!appKey || _.isEmpty(appKey)){
                keyIsAvailable = true;
            }

            if(appKey && appKey['_id']){
                elementId = new mongoose.Types.ObjectId().toHexString();
            }
        }

        if(errorGettingId){
            return res.send({
                error : {
                    message : 'An error occured while initializing the element.'
                }
            });
        }

        let newElement = await AppElementCollection.create({
            companyId : req.user['companyId'],
            versionTracker : [{version : 0}],
            createdDate : timestamp,
            createdById : req.user['_id'].toString(),
            editDate : timestamp,
            lastUpdatedById : req.user['_id'].toString(),
            appId,
            pageId,
            elementId,
            elementRefId : is404Page ? 'body2' : 'body1',
            elementType : 'body',
            nestedElementIds : [],
            rootElement : true,
            ...divInitObject()
        })
        .catch(e => {
            console.log('init page newElement mongo error', e)
            return {error : true}
        });

        if(
            !newElement ||
            (
                newElement && 
                !newElement['_id']
            ) ||
            (
                newElement && 
                newElement['error']
            )
        ){
            //delete page
            await AppPageCollection.deleteOne({pageId})
            .catch(e => {
                return {deletedCount : 0}
            });

            return {
                error : {
                    message : 'Failed to create app page and root element.'
                }
            }
        }

        return {
            page : newPage,
            element : newElement
        }
    }catch(e){
        console.log('/utils/appBuilder/page/createPage catch error', e);
        return {error : true}
    }
}