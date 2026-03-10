const mongoose = require('mongoose');
const {Schema} = mongoose;
const config = require('../../config/config')();

const appElementSchema = new Schema({
    companyId : {
        type : String,
        required : true
    },
    appId : {
        type : String,
        required : true
    },
    elementId : {
        type : String,
        required : true
    },
    elementRefId : {
        type : String,
        required : true
    },
    abTestId : {
        type : String
    },
    variationId : {
        type : String,
        default : 'original'
    },
    versionTracker : [{
        version : {
            type : Number,
            required : true
        }
    }],
    deployed : {
        type : Boolean,
        default : false
    },
    lastUpdatedById : String,
    createdDate : {
        type : Number,
        required : true
    },
    createdById : {
        type : String,
        required : true
    },
    editDate : Number,
    pageId : {
        type : String,
        required : true
    },
    rootElement : {
        type : Boolean,
        default : false
    },
    classNames : [{
        desktop : [String],
        tablet : [String],
        mobile : [String],
        mobileLandscape : [String]
    }],
    elementType : {
        type : String,
        required : true,
        enum : [
            'section', 'container', 'div', 'span', 'list', 'listItem',
            'button', 'heading', 'paragraph', 'textBlock', 'blockQuote',
            'image', 'mediaPlayer', 'input', 'textarea', 'checkbox', 'fileUpload',
            'radioButton', 'select', 'switch', 'recaptcha', 'table', 'dropdown', 
            'embed', 'icon', 'navbar', 'slider', 'mapbox', 'googleMap', 'tabWrapper', 'chart', 'signaturePad',
            'modal', 'rate', 'richTextEditor', 'codeEditor', 'progressBar',
            'pdfViewer', 'timer', 'iFrame', 'timeline', 'droppable', 'calendar', 'canvas',
            'stripeCardPayment', 'link', 'linkBlock', 'hr', 'roundExpandableShape', 'rectangularExpandableShape',
            'pdfPrintable', 'form', 'draggable', 'slideNav', 'slideSelector', 'slide', 'tab', 'tabControl',
            'tabMenu', 'tabContentWrapper', 'tableHeaderRow', 'tableFilterRow', 'tableDataRow', 'tableDataRowWrapper',
            'columnHeader', 'columnFilter', 'columnCell', 'body', 'login_button', 'logout_button',
            'profile_button', 'richTextViewer', 'listNav', 'displayLimitSelector', 'csvToJsonUploader',
            'listIndexInput', 'listPageCountText', 'paginationWrapper', 'listDataRowWrapper', 'wysiwyg',
            'stripePaymentElement', 'webComponent', 'autoComplete', 'pdfPage', 'documentPage',
            'signature', 'dateSigned', 'initials', 'textField', 'documentPageList', 'documentPageListWrapper',
            'dragAndDropWrapper', 'subscriptionPaymentElement'
        ]
    },
    elementSettings : {},
    styleArray : [{
        styleField : {
            type : String,
            required : true
        },
        set : {
            type : Boolean,
            default : false
        },
        directSet : {
            type : Boolean,
            default : false
        },
        styleValueVariations : {
            desktop : {},
            tablet : {},
            mobile : {},
            mobileLandscape : {},
        }
    }],
    hoverStyleArray : [{
        styleField : {
            type : String,
            required : true
        },
        set : {
            type : Boolean,
            default : false
        },
        directSet : {
            type : Boolean,
            default : false
        },
        styleValueVariations : {
            desktop : {},
            tablet : {},
            mobile : {},
            mobileLandscape : {},
        }
    }],
    pressStyleArray : [{
        styleField : {
            type : String,
            required : true
        },
        set : {
            type : Boolean,
            default : false
        },
        directSet : {
            type : Boolean,
            default : false
        },
        styleValueVariations : {
            desktop : {},
            tablet : {},
            mobile : {},
            mobileLandscape : {},
        }
    }],
    focusStyleArray : [{
        styleField : {
            type : String,
            required : true
        },
        set : {
            type : Boolean,
            default : false
        },
        directSet : {
            type : Boolean,
            default : false
        },
        styleValueVariations : {
            desktop : {},
            tablet : {},
            mobile : {},
            mobileLandscape : {},
        }
    }],
    hasUpdatedStyles : {
        type : Boolean,
        default : false
    },
    nestedElementIds : [String], //not all elements are nestable
    animations  : [],
    base64 : String,
    staticFileId : String,
    staticFileUrl : String
}, {
    timestamps : true,
    strict : true,
    useNestedStrict : true
});

appElementSchema.index({
    companyId : 1, appId : 1, elementId : 1, abTestId : 1,
    variationId : 1, 'versionTracker.version' : 1, deployed : 1,
    pageId : 1, rootElement : 1, elementType : 1
})

module.exports = mongoose.model(config.appElementModel, appElementSchema, config.appElementModel)