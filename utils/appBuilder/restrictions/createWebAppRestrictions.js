// const mongoose = require('mongoose');
// const config = require('../../../config/config')();
const {isEmpty} = require('lodash');

module.exports =  async (subscription={}, InhouzAppCollection, appType='') => {
    try{
        const {
            companyId='', nonProductionWebAppLimit=0,
            subscriptionServicePlanType=''
        } = subscription;
        if(
            !companyId || 
            typeof companyId !== 'string' ||
            !InhouzAppCollection ||
            !appType ||
            typeof appType !== 'string'
        ){
            return {
                error : {
                    message : 'Required validation fields are missing.'
                }
            }
        }

        let webApps = await InhouzAppCollection.find({
            companyId,
            appType
        })
        .catch(e => {
            console.log('/createWebAppRestrictions getWebApp mongo error', e);
            return {error : true};
        });

        if(webApps && webApps['error']){
            return {
                error : {
                    message : 'An error occured while validating account limits.'
                }
            } 
        }

        let limitMet = false, count=0;
        if(appType === 'webComponent'){
            if(
                ['solopreneur', 'freelancer'].includes(subscriptionServicePlanType) && 
                webApps.length > 0
            ){
                limitMet = true;
            }else{
                limitMet = false;
            }

            return {
                limitMet
            }
        }
        
        for (let i = 0; i < webApps.length; i++){
            let webApp = webApps[i];
            const {productionDeployedVersionMap={}} = webApp;
            if(isEmpty(productionDeployedVersionMap)){
                count++;
                if(count >= nonProductionWebAppLimit){
                    limitMet = true;
                    break;
                }
            }
        }

        return {
            limitMet
        }
    }catch(e){
        console.log('/createWebAppRestrictions catch block error', e);
        return {
            error : {
                message : 'An error occured while validating account limits.'
            }
        }
    }
}