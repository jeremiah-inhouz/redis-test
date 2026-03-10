const fetch = require('node-fetch');

module.exports = async (url) =>{
    const request = await fetch(url, {
        method : 'DELETE',
        credentials : 'include'
    })
    .then(res => {
        if(res.status !== 200){
            return {hasError:true};
        }
        return res.json();
    })
    .catch((error) => {
        if(error){
            return {hasError:true};
        }
    })

    return request;
}