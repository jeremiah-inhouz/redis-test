module.exports = (userAccount={}, password='', inhouzApp={}, environment) => {
    try{
        let template = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Change Password Email</title>
            <style>
                .baseMargin15 : {
                    margin-bottom : 15px
                }
                .baseMargin5 : {
                    margin-bottom : 5px
                }
            </style>
          </head>
          <body>
            <table border='0' cellspacing='0' cellpadding='0'>
                <tr>
                    <div
                        class='baseMargin15'
                    >
                        Hi <strong>${userAccount['firstName']} ${userAccount['lastName']}</strong>
                    </div>
                </tr>
                <tr>
                    <div
                        class='baseMargin5'
                    >
                        Below is your change request password for the app named ${inhouzApp['appName']} - ${environment} environment. Please use to change your password.
                    </div>
                    <div
                        class='baseMargin15'
                    >
                        ${password}
                    </div>
                </tr>
                <tr>                                      
                    <div>
                        inhouz Authorization System
                    </div>
                </tr>
            </table>
          </body>
        </html>
        `

        let strippedTemplate = template.split('/n');
        let finalTemplate = strippedTemplate.join('');
        return {
            success : true,
            emailTemplate : finalTemplate
        }
    }catch(e){
        console.log('newPasswordEmailTemplate catch block error', e);
        return {success : false};
    }
}