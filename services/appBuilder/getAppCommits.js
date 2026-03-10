const sanitizer = require('sanitizer');
const {recursiveSanitizer} = require('../../utils/sanitizer/recursiveSanitizer');
const config = require('../../config/config')();
const _ = require('lodash');
const mongoose = require('mongoose');
const parseFilter = require('../../utils/filter/parseFilter');
const encryptDecrypt = require('../../utils/cryptography/encryptDecrypt');
const appCommitFilterMap = require('../../utils/appBuilder/appCommit/filter/appCommitFilterMap');
const appCommitNonRegexList = require('../../utils/appBuilder/appCommit/filter/appCommitNonRegexList');
const appCommitTypeMap = require('../../utils/appBuilder/appCommit/filter/appCommitTypeMap');

module.exports = async (req, res) => {
    try{
        const reqBody = recursiveSanitizer(req.body, sanitizer);
        const {
            filter={}, sort={}, skip=0, limit=0,
            encryptedCompanyId=''
        } = reqBody;

        if(
            !encryptedCompanyId ||
            typeof encryptedCompanyId !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        let companyId;
        let decryptedData = encryptDecrypt(encryptedCompanyId);
        if(decryptedData){
            let parsedData = JSON.parse(decryptedData);
            if(new Date().getTime() <= parsedData['expirationTimestamp']){
                companyId = parsedData['companyId'];
            }
        }

        if(
            !companyId ||
            typeof companyId !== 'string'
        ){
            return res.status(400).send({
                error : {
                    message : 'Invalid request. Required fields are missing.'
                }
            });
        }

        const CompanyCollection = mongoose.model(config.companyModel);
        let companyObj = await CompanyCollection.findOne({
            _id : companyId
        })
        .lean()
        .catch(e => {
            console.log('/getAppCommits get company mongo error', e);
            return {error : true};
        });

        if(!companyObj){
            return {
                error : {
                    message : 'Account was not found.'
                }
            }
        }

        if(companyObj && companyObj['error']){
            return {
                error : {
                    message : 'An error occurred while finding your tenant account.'
                }
            }
        }

        if(companyObj['status'] !== 'active'){
            return {
                error : {
                    message : 'Account is not active.'
                }
            }
        }

        let parsedFilter = parseFilter(
            filter, appCommitFilterMap, 
            appCommitNonRegexList, 
            appCommitTypeMap
        );

        let InhouzAppCommitCollection = mongoose.model(config.inhouzAppCommitModel);
        let appCommits = await InhouzAppCommitCollection.find(
            parsedFilter,
            {
                compressedAppData : 0
            }
        )
        .sort(sort)
        .skip(skip)
        .limit(limit);

        let total_count = await InhouzAppCommitCollection.count(parsedFilter);

        return res.send({
            results : appCommits,
            total_count
        });
    }catch(e){
        console.log('/getAppCommits catch block error', e);
        return res.status(500).send({
            error : {
                message : 'An error occurred while finding app commits.'
            }
        });
    }
}