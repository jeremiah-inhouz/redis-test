const sgMail = require('@sendgrid/mail');
const config = require('../../../config/config')();

module.exports = (to, from, subject, text, html) => {
    try{
        sgMail.setApiKey(config.sendGridApiKey);

        const msg = {
            to,
            from,
            subject
        }

        if(text && !html){
            msg.text = text;
        }else if(!text && html){
            msg.html = html;
        }else if(text && html){
            msg.html = html;
        }else{
            msg.text = ''
        }
        sgMail.send(msg);
        return {success : true};
    }catch(e){
        console.log('sendEmail util catch error', e);
        return {success : false};
    }
}