const fetch = require('node-fetch');

module.exports = async (url, headers={}, data) => {
    const request = await fetch(url, {
        method : 'POST',
        headers:{
            'Accept':"application/json",
            'Content-Type':"application/json",
            ...headers
        },
        body:JSON.stringify(data)
    })
    .then(async res => {
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
        console.log('/postRequest catch block error', error);
        return {
            hasError : true,
            errorPayload : error,
            errorMessage : ''
        };
    })

    return request;
}