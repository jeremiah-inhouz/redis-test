const fetch = require('node-fetch');

module.exports = async (url) => {
    const request = await fetch(url,{
        method:'GET',
        credentials:'include'
    })
    .then(async res => {
        if(res.status !== 200){
            let resJson = await res.json();
            return {
                hasError : true,
                errorPayload : (
                    resJson['error'] && 
                    resJson['error']['errorPayload'] ?
                    typeof resJson['error']['errorPayload'] !== 'string' ?
                    JSON.stringify(resJson['error']['errorPayload']) : 
                    resJson['error']['errorPayload']
                    :
                    ''
                ) || '',
                errorMessage : (
                    resJson['error'] && 
                    resJson['error']['message']
                ) || ''
            };
        }
        let jsonResponse = await res.json();
        if(jsonResponse.error || jsonResponse.hasError){
            return {
                hasError : true,
                errorPayload : (
                    jsonResponse['error'] && 
                    jsonResponse['error']['errorPayload'] ?
                    typeof jsonResponse['error']['errorPayload'] !== 'string' ?
                    JSON.stringify(jsonResponse['error']['errorPayload']) : 
                    jsonResponse['error']['errorPayload']
                    :
                    ''
                ) || '',
                errorMessage : (
                    jsonResponse['error'] && 
                    jsonResponse['error']['message']
                ) || ''
            }
        }
        return jsonResponse;
    })
    .catch((error) => {
        if(error){
            return {
                hasError : true,
                errorPayload : error
            };
        }
    })

    return request;
}