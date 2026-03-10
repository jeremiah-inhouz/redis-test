const config = require('../../config/config')();
const mongoose = require('mongoose');
const moment = require('moment');

module.exports = async (info={}) => {
    try{
        const {
            companyId='', userId='', subscriptionId='',
            email='', isInternal=false, environment=''
        } = info;
        if(
            !info['assetOwnerCompanyId'] ||
            !companyId ||
            !email ||
            (
                isInternal && 
                (
                    !userId ||
                    typeof userId !== 'string'
                )
            ) ||
            typeof companyId !== 'string' ||
            typeof email !== 'string' ||
            typeof info['assetOwnerCompanyId'] !== 'string'
        ){
            return {
                error : {
                    message : 'Invalid credentials'
                }
            }
        }

        let user, subscriberId='';
        const UserCollection = mongoose.model(config.userModel);
        const SubscriberCollection = mongoose.model(config.subscriberModel);
        if(isInternal){
            //confirm subscription
            let subcriberProfile = await SubscriberCollection.findOne({
                email,
                companyId,
                assetOwnerCompanyId : info['assetOwnerCompanyId'],
                subscriptionIds : subscriptionId,
                subscriberType : 'internal',
                active : true
            })
            .lean()
            .catch(e => {
                console.log('getSubscriptionUser getSubscriber catch error', e);
                return false
            });

            if(
                !subcriberProfile ||
                (
                    subcriberProfile && 
                    !subcriberProfile['_id']
                )
            ){
                return {
                    error : {
                        message : 'User/Subscriber not found.'
                    }
                }
            }

            subscriberId = subcriberProfile['_id'].toString()
            user = await UserCollection.findOne({
                _id : userId,
                companyId,
                active : true
            })
            .lean()
            .catch(e => {
                console.log('/utils/user/getSubscriptionUser get user mongo error', e);
                return {
                    error : e
                }
            });
        }else{
            user = await SubscriberCollection.findOne({
                email,
                companyId,
                assetOwnerCompanyId : info['assetOwnerCompanyId'],
                subscriptionIds : subscriptionId,
                active : true
            })
            .lean()
            .catch(e => {
                console.log('getSubscriptionUser getSubscriber catch error', e);
                return {
                    error : e
                }
            });
        }

        if(!user){
            return {
                error : {
                    message : 'User/Subscriber not found.'
                }
            }
        }

        if(
            user && 
            user['error']
        ){
            return {
                error : {
                    message : 'Failed to find user/subscriber.'
                }
            }
        }

        if(!isInternal){
            subscriberId = user['_id'].toString();
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let company = await CompanyCollection.findOne({
            _id : companyId,
            status : 'active'
        })
        .lean()
        .catch(e => {
            console.log('get company mongo catch error', e)
            return {error : true};
        });

        if(
            !company
        ){
            return {
                error : {
                    message : 'Company not found.'
                }
            };
        }
        if(
            company && 
            company['error']
        ){
            return {
                error : {
                    message : 'Failed to get company data.'
                }
            };
        }

        const SubscriptionCollection = mongoose.model(config.subscriptionModel);
        let subscription = await SubscriptionCollection.findOne({
            _id : subscriptionId,
            companyId,
            subscriberEmail : email,
            environment,
            activeSubscriber : true,
            assetType : 'api',
            status : {
                $in : ['active', 'inRenewal']
            }
        })
        .lean()
        .catch(e => {
            console.log('/utils/user/getSubscriptionUser get subscription catch error', e);
            return {error : e};
        });

        if(!subscription){
            return {
                error : {
                    message : 'Subscription not found.'
                }
            }
        }

        if(
            subscription && 
            subscription['error']
        ){
            return {
                error : {
                    message : 'Failed to find subscription.'
                }
            }
        }

        if(
            subscription['limitReached'] && 
            !subscription['allowPingOverage']
        ){
            return {
                error : {
                    message : 'Subscription limit has been reached.'
                }
            }
        }

        const {
            subscriptionServiceId='', assetOwnerCompanyId='',
            subscriptionServiceTierId='', encryptedApiKey=''
        } = subscription;
        const SubscriptionServiceCollection = mongoose.model(config.subscriptionServiceModel);
        const subscriptionService = await SubscriptionServiceCollection.findOne({
            subscriptionServiceId,
            companyId : assetOwnerCompanyId,
            deployed : true
        })
        .lean()
        .catch(e => {
            console.log('/utils/user/getSubscriptionUser subscriptionService mongo error', e);
            return {error : e};
        });

        if(!subscriptionService){
            return {
                error : {
                    message : 'Subscription service not found.'
                }
            }
        }

        if(
            subscriptionService && 
            subscriptionService['error']
        ){
            return {
                error : {
                    message : 'Failed to find subscription service.'
                }
            }
        }

        if(!subscriptionService['serviceIsActive']){
            return {
                error : {
                    message : 'Subscription service is not active.'
                }
            }
        }

        let tier;
        const {customPaymentTiers=[], assetType='', signupExtraDataFields=[]} = subscriptionService;
        for (let i = 0; i < customPaymentTiers.length; i++){
            let customPaymentTier = customPaymentTiers[i];
            let {_id=''} = customPaymentTier;
            if(_id.toString() === subscriptionServiceTierId){
                tier = customPaymentTier;
                break;
            }
        }

        if(!tier){
            return {
                error : {
                    message : 'Subscription plan was not found.'
                }
            }
        }

        const {tierPermissionIdList=[]} = tier;
        const PermissionCollection = mongoose.model(config.permissionModel);
        let permissions = await PermissionCollection.find({
            companyId : assetOwnerCompanyId,
            _id : {
                $in : tierPermissionIdList
            }
        })
        .catch(e => {
            console.log('get permissions catch error', e);
            return {error : e}
        });

        if(permissions && permissions['error']){
            return {
                error : {
                    message : 'Failed to get user permissions.'
                }
            }
        }

        let permissionNames = permissions.map(permission => permission['permissionName']);
        let userDob = user['dob'] || '';
        let age = 0;
        if(userDob){
            age = moment().diff(moment(userDob), 'years');
        }

        let userObj = {};
        userObj['environment'] = environment;
        userObj['subscriptionServiceId'] = subscriptionServiceId;
        userObj['subscriptionServiceTierId'] = subscriptionServiceTierId;
        // userObj['companyName'] = req.userCompany['companyName'];
        userObj['companyId'] = companyId;
        userObj['subscriberType'] = subscription['serviceType'];
        userObj['serviceName'] = subscriptionService['serviceName'];
        userObj['planName'] = tier['paymentTierName'];
        userObj['assetOwnerCompanyId'] = subscription['assetOwnerCompanyId'];
        userObj['subscriberId'] = subscriberId;
        userObj['permissions'] = permissions.map(obj => {
            return {
                _id : obj['_id'].toString(),
                permissionName : obj['permissionName']
            }
        });
        if(isInternal){
            userObj = {
                ...userObj,
                firstName : user['userName'] || '',
                middleName : user['middleName'] || '',
                lastName : user['lastName'] || '',
                email : user['email'] || '',
                sex : user['sex'] || '',
            }
        }else{
            let userKeys = Object.keys(user);
            for (let i = 0; i < signupExtraDataFields.length; i++){
                let dataField = signupExtraDataFields[i];
                if(['passwordHash', 'password'].includes(dataField['key'])){
                    continue;
                }
                if(userKeys.includes(dataField['key'])){
                    userObj[dataField['key']] = user[dataField['key']];
                }
            }
        }
        return {
            age,
            permissionIds : tierPermissionIdList,
            permissionNames,
            permissions : permissionNames,
            userType : 'subscriptionUser',
            companyName : company['companyName'] || '',
            industry : company['industry'] || '',
            subscriptionTierName : tier['paymentTierName'] || '',
            subscriptionServiceName : subscriptionService['serviceName'] || '',
            ...userObj,
            isInternal,
            subscriptionId,
            isAuthenticated : true,
            _id : userId || subscriberId || userObj['_id'] || ''
        }
    }catch(e){
        console.log('/utils/user/getSubscriptionUser catch error', e);
        return {
            error : {
                message : 'Failed to get subscriber information.'
            }
        }
    }
}