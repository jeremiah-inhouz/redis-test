const getRecursiveElementIds = (id, appElementsMap={}) => {
    try{
        let accumulator = [];
        if(Array.isArray(id)){
            for (let i = 0; i < id.length; i++){
                accumulator.push(
                    ...getRecursiveElementIds(id[i], appElementsMap)
                )
            }
        }else{
            let element = appElementsMap[id] || {}
            let {
                nestedElementIds=[], elementType='',
                elementSettings={}
            } = element;
            let idList = [...nestedElementIds];
            if(['tabWrapper', 'table', 'slider'].includes(elementType)){
                let {
                    columnCellElementIds=[], columnFilterElementIds=[],
                    columnHeaderElementIds=[], slideElementIds=[],
                    tabContentElementId=[], tabMenuElementId=[]
                } = elementSettings;
                if(elementType === 'table'){
                    idList.push(...columnCellElementIds);
                    idList.push(...columnFilterElementIds);
                    idList.push(...columnHeaderElementIds);
                }else if(elementType === 'tabWrapper'){
                    idList.push(...tabContentElementId);
                    idList.push(...tabMenuElementId);
                }else if(elementType === 'slider'){
                    idList.push(...slideElementIds);
                }
            }

            accumulator.push(id);
            accumulator.push(
                ...getRecursiveElementIds(idList, appElementsMap)
            )
        }

        return accumulator;
    }catch(e){
        console.log('/utils/appBuilder/clone/recursiveElementTreeId', e);
        return [];
    }
}

module.exports = getRecursiveElementIds;