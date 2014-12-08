
/////////////////////////////////////////////////////////////////////
//
//  TYPE: 
//  NAME: 
//  NAMESPACE: 
//  
//  SUMMARY
//      
//  
//  PUBLIC FIELDS  
//      
//
//  PUBLIC FUNCTIONS
//      
//
//  DEPENDENCIES
//      
//
//////////////////////////////////////////////////////////////////////

// Ensure that the LOUISE namespace is avaiable
if (NE === null || NE === undefined) { var NE = {}; }

NE.Constants = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _basePath;

    //////////////////////
    //
    //  Initiation
    //
    /////////////////////

    (function () {

        _basePath = window.parent ? window.parent.location.href : window.location.href;
        _basePath = _basePath.split('/').slice(0, -1).join('/');

    })();

    //////////////////////
    //
    //  Private functions 
    //
    /////////////////////

    

    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    return {

        //////////////////////
        //
        //  Public fields 
        //
        /////////////////////

        APPLICATION_BASE_PATH: _basePath,
        MAIN_CONTENT_CONTAINER_ID: 'NE-main-container',
        SCROLL_CONTAINER_ID: 'NE-scroller',
        CHAPTER_CLASS: 'NE-chapter',
        PAGE_ID_PREFIX: 'NE-page-',
        CHAPTER_ID_PREFIX: 'NE-chapter-',
        FLOATING_HEADER_ID: 'NE-top',
        CLOSE_BUTTON_ID: 'NE-top-close-btn',
        OF_CANVAS_TOP_CLASS: 'NE-offcanvas',
        HEADER_CHAPTER_NAV_ICON: '<i class="fa fa-navicon ml-xs"></i>',

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null};

})();

