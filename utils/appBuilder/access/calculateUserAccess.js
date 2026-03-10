module.exports = (appInFocus={}, user={}, accessType='') => {
    if(
        (appInFocus && appInFocus['_id']) && 
        (user && user['_id'])
    ){
        const {
            companyId='', settings={}
        } = appInFocus;
        const {
            restrictEditorAccess=false,
            shareWithExternalUsers=false,
            externalUsers=[],
            readPermissionIds=[], writePermissionIds=[]
        } = settings;

        let internalUser = companyId === user['companyId'];
        if(internalUser){
            if(restrictEditorAccess){
                const {permissionIdList=[]} = user;
                let accessMap = {
                    readAccess : false,
                    writeAccess : false
                };
                if(readPermissionIds.length === 0){
                    accessMap['readAccess'] = true;
                }
                if(writePermissionIds.length === 0){
                    accessMap['writeAccess'] = true;
                }
                if(
                    !accessMap['readAccess'] ||
                    !accessMap['writeAccess']
                ){
                    for (let i = 0; i < permissionIdList.length; i++){
                        let permissionId = permissionIdList[i];
                        if(!accessMap['readAccess']){
                            if(readPermissionIds.includes(permissionId)){
                                accessMap['readAccess'] = true;
                            }
                        }
                        if(!accessMap['writeAccess']){
                            if(writePermissionIds.includes(permissionId)){
                                accessMap['writeAccess'] = true;
                            }
                        }
                        if(
                            accessMap['readAccess'] && 
                            accessMap['writeAccess']
                        ){
                            break;
                        }
                    }
                }
                return accessMap[accessType] ? true : false;
            }else{
                return true;
            }
        }else{
            if(shareWithExternalUsers){
                let accessSet = false, map={};
                for (let i = 0; i < externalUsers.length; i++){
                    let externalUser = externalUsers[i];
                    if(
                        externalUser['email'].toLowerCase().trim() === 
                        user['email'].toLowerCase().trim()
                    ){
                        map = {
                            readAccess : externalUser['readPermission'] ? true : false,
                            writeAccess : externalUser['writePermission'] ? true : false
                        };
                        accessSet = true;
                        break;
                    }
                }
                if(!accessSet){
                    return false;
                }

                return map[accessType] ? true : false;
            }else{
                return false;
            }
        }
    }else{
        return false;
    }
}