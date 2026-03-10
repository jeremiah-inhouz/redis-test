const NodeRSA = require("node-rsa");
const path = require("path");
const fs = require("fs");

function readSecret(name, envFallback) {
    const secretsPath = process.env.SECRETS_PATH || "/mnt/secrets";
    const filePath = path.join(secretsPath, name);

    try {
        return fs.readFileSync(filePath, "utf8").trim();
    } catch {
        return process.env[envFallback] || "";
    }
}

module.exports = () => {
    switch (process.env.NODE_ENV) {
        default:
            return {
                flexformFileModel: process.env.FLEX_FORM_FILE_MODEL,
                flexModuleModel: process.env.FLEX_MODULE_MODEL,
                flexCollectionModel: process.env.FLEX_COLLECTION_MODEL,
                formModel: process.env.FORM_MODEL,
                sendGridApiKey: readSecret("sendgridapikey", "SENDGRID_API_KEY"),
                smplEmail: process.env.SMPL_EMAIL,
                dataRuleExecutionResultModel:
                    process.env.DATA_RULE_EXECUTION_RESULT_MODEL,
                sessionSecret: readSecret("sessionsecret", "SESSION_SECRET"),
                mongoUrl: readSecret("mongourl", "MONGO_URL"),
                userModel: process.env.USER_MODEL,
                companyModel: process.env.COMPANY_MODEL,
                roleModel: process.env.ROLE_MODEL,
                permissionModel: process.env.PERMISSION_MODEL,
                userRolesModel: process.env.USER_ROLES_MODEL,
                sessionModel: process.env.SESSION_MODEL,
                sessionValidatorModel: process.env.SESSION_VALIDATOR_MODEL,
                authLogModel: process.env.AUTH_LOG_MODEL,
                queryKeyTrackerModel: process.env.QUERY_KEY_TRACKER_MODEL,
                adminPermission: "admin",
                clientSecretKey: readSecret("clientsecretkey", "CLIENT_SECRET_KEY"),
                cookieDomain: process.env.COOKIE_DOMAIN,
                inhouzAppModel: process.env.INHOUZ_APP_MODEL,
                appElementModel: process.env.APP_ELEMENT_MODEL,
                personalizedAppBuilderSettingsModel:
                    process.env.PERSONALIZED_APP_BUILDER_SETTINGS_MODEL,
                abTestsModel: process.env.AB_TESTS_MODEL,
                appElementUpdateQueueModel: process.env.APP_ELEMENT_UPDATE_QUEUE_MODEL,
                appUpdateQueueModel: process.env.APP_UPDATE_QUEUE_MODEL,
                appPageModel: process.env.APP_PAGE_MODEL,
                appPageBuildModel: process.env.APP_PAGE_BUILD_MODEL,
                pageUpdateQueueModel: process.env.PAGE_UPDATE_QUEUE_MODEL,
                appBuilderSocketTrackerModel:
                    process.env.APP_BUILDER_SOCKET_TRACKER_MODEL,
                functionModel: process.env.FUNCTION_MODEL,
                functionVersionTrackerModel: process.env.FUNCTION_VERSION_TRACKER_MODEL,
                operationTrackerModel: process.env.OPERATION_TRACKER_MODEL,
                appFolderModel: process.env.APP_FOLDER_MODEL,
                adminPermissions: ["adminDeveloper"],
                redisHost: readSecret("redishost", "REDIS_HOST"),
                redisPassword: readSecret("redispassword", "REDIS_PASSWORD"),
                redisDB: process.env.REDIS_DB,
                webComponentAccessTrackerModel:
                    process.env.WEB_COMPONENT_ACCESS_TRACKER,
                appBuildModel: process.env.APP_BUILD_MODEL,
                apiDeveloperPermission: process.env.API_DEVELOPER_PERMISSION,
                uiDeveloperPermission: process.env.UI_DEVELOPER_PERMISSION,
                adminDeveloperPermission: process.env.ADMIN_DEVELOPER_PERMISSION,
                appProductionDeploymentPermission:
                    process.env.APP_PRODUCTION_DEPLOYMENT_PERMISSION,
                deleteAppPermission: process.env.DELETE_APP_PERMISSION,
                appBuilderExternalAccessModel:
                    process.env.APP_BUILDER_EXTERNAL_ACCESS_MODEL,
                savedAppStylesModel: process.env.SAVED_APP_STYLES,
                styleGuideModel: process.env.STYLE_GUIDE_MODEL,
                appBuildReportModel: process.env.APP_BUILD_REPORT_MODEL,
                externalUserEditorAccessLogModel:
                    process.env.EXTERNAL_USER_EDITOR_ACCESS_LOG_MODEL,
                appAccessPasswordModel: process.env.APP_ACCESS_PASSWORD_MODEL,
                savedAppElementModel: process.env.SAVED_APP_ELEMENT_MODEL,
                appDeploymentQueueModel: process.env.APP_DEPLOYMENT_QUEUE_MODEL,
                appDeploymentQueueLogModel: process.env.APP_DEPLOYMENT_QUEUE_LOG_MODEL,
                NodeRsaClientPrivateKey: new NodeRSA(
                    readSecret("clientsecretkey", "CLIENT_SECRET_KEY"),
                    {
                        environment: "node",
                    },
                ),
                inhouzSubscriptionsModel: process.env.INHOUZ_SUBSCRIPTIONS_MODEL,
                limitedCompanyTypes: [
                    "solopreneur",
                    "founder",
                    "entrepreneur",
                    "freelancer",
                ],
                customDomainLogModel: process.env.CUSTOM_DOMAIN_LOG_MODEL,
                cloudflareZoneId: readSecret("cloudflarezoneid", "CLOUDFLARE_ZONE_ID"),
                cloudflareApiUrl: process.env.CLOUDFLARE_API_URL,
                customDomainTerminationQueueModel:
                    process.env.CUSTOM_DOMAIN_TERMINATION_QUEUE_MODEL,
                cloudflareAuthEmail: readSecret(
                    "cloudflareauthemail",
                    "CLOUDFLARE_AUTH_EMAIL",
                ),
                cloudflareAuthKey: readSecret(
                    "cloudflareauthkey",
                    "CLOUDFLARE_AUTH_KEY",
                ),
                s3AccessKeyId: readSecret("s3accesskeyid", "S3_ACCESS_KEY_ID"),
                s3SecretKey: readSecret("s3secretkey", "S3_SECRET_KEY"),
                s3BucketName: readSecret("s3bucketname", "S3_BUCKET_NAME"),
                staticBase64FileModel: process.env.STATIC_BASE64_FILE_MODEL,
                documentAppTypes: ["inhouzSign", "pdfFunction"],
                commitAppTypes: ["webApp", "webComponent"],
                inhouzSignStaticFileModel: process.env.INHOUZ_SIGN_STATIC_FILE_MODEL,
                systemUserModel: process.env.SYSTEM_USER_MODEL,
                subscriberModel: process.env.SUBSCRIBER_MODEL,
                subscriptionServiceModel: process.env.SUBSCRIPTION_SERVICE_MODEL,
                subscriptionModel: process.env.SUBSCRIPTION_MODEL,
                inhouzCloudStorageFileModel:
                    process.env.INHOUZ_CLOUD_STORAGE_FILE_MODEL,
                awsS3StorageLocation: "AWS S3",
                azureStorageLocation: "Azure Blob Storage",
                googleStorageLocation: "Google Cloud Storage",
                vimeoStorageLocation: "Vimeo",
                fileStorageServiceModel: process.env.FILE_STORAGE_SERVICE_MODEL,
                gcsProjectId: readSecret("gcsprojectid", "GCS_PROJECT_ID"),
                gcsPrivateKeyId: readSecret("gcsprivatekeyid", "GCS_PRIVATE_KEY_ID"),
                gcsPrivateKey: readSecret("gcsprivatekey", "GCS_PRIVATE_KEY"),
                gcsClientEmail: readSecret("gcsclientemail", "GCS_CLIENT_EMAIL"),
                gcsClientId: readSecret("gcsclientid", "GCS_CLIENT_ID"),
                gcsClientX509CertUrl: readSecret(
                    "gcsclientx509certurl",
                    "GCS_CLIENT_X509_CERT_URL",
                ),
                inhouzSignDraftBucketName: process.env.INHOUZ_SIGN_DRAFT_BUCKET_NAME,
                inhouzSignAttachmentBucketName:
                    process.env.INHOUZ_SIGN_ATTACHMENT_BUCKET_NAME,
                inhouzSignCompletedDocumentBucketName:
                    process.env.INHOUZ_SIGN_COMPLETED_DOCUMENT_BUCKET_NAME,
                inhouzSignDocModel: process.env.INHOUZ_SIGN_DOC_MODEL,
                inhouzSignTemplateModel: process.env.INHOUZ_SIGN_TEMPLATE_MODEL,
                appBuilderMsUrl: process.env.APP_BUILDER_MS_URL,
                inhouzPdfGeneratorDraftBucketName:
                    process.env.INHOUZ_PDF_GENERATOR_DRAFT_BUCKET_NAME,
                pdfGeneratorTemplateModel: process.env.PDF_GENERATOR_TEMPLATE_MODEL,
                inhouzAppCommitModel: process.env.INHOUZ_APP_COMMIT_MODEL,
                inhouzAppRebaseFallbackLogModel:
                    process.env.INHOUZ_APP_REBASE_FALLBACK_LOG_MODEL,
                deployedFunctionModel: process.env.DEPLOYED_FUNCTION_MODEL,
            };
    }
};
