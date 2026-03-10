const _ = require('lodash');

recursiveSanitizer = (element, sanitizer) => {
    if(_.isObject(element)){
        for (let k in element){
            recursiveSanitizer(element[k], sanitizer);
        }
    }else if(_.isArray(element)){
        for (let i = 0; i < element.length; i++){
            recursiveSanitizer(element[i]);
        }
    }else{
        element = sanitizer.sanitize(element);
    }

    return element;
}

module.exports = {
    recursiveSanitizer
}