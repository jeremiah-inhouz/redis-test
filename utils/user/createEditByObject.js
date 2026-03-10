module.exports = (user={}, deployDate) => {
    try{
        const {
            _id='', firstName='', middleName='',
            lastName='', email='', imageUrl='',
            jobTitle=''
        } = user;
        return {
            userId : _id,
            firstName : firstName,
            lastName : lastName,
            middleName : middleName,
            fullName : `${firstName ? firstName + ' ' : ''}${middleName ? middleName + ' ' : ''}${lastName ? lastName : ''}`,
            email : email,
            imageUrl : imageUrl, 
            jobTitle : jobTitle,
            editDate : deployDate
        }
    }catch(e){
        console.log('createEditByObject catch block error', e);
        return {}
    }
}