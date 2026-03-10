module.exports = (filter={}, filterMap={}, nonRegexList=[], typeMap={}) => {
    try{
        let accumulator = {}
        for (let key in filter){
            let mappedKey = filterMap[key];
            if(mappedKey){
                let value = filter[key];
                let typeMapVal = typeMap[mappedKey];
                let queryType = typeof value;
                if(
                    (
                        Array.isArray(typeMapVal) && 
                        typeMapVal.includes(queryType)
                    ) ||
                    (
                        !Array.isArray(typeMapVal) && 
                        typeMapVal === queryType
                    )
                ){
                    if(nonRegexList.includes(mappedKey)){
                        if(
                            value ||
                            ['number', 'boolean'].includes(queryType)
                        ){
                            accumulator[mappedKey] = value;
                        }
                    }else{
                        if(value){
                            accumulator[mappedKey] = {
                                $regex : `.*${value}.*`,
                                $options : 'i'
                            }
                        }
                    }
                }
            }
        }
        return accumulator;
    }catch(e){
        console.log('/utils/filter/parseFilter catch block error', e);
        return {}
    }
}