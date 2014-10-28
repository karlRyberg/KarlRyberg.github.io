/// <reference path="NE.Constants.js" />
/// <reference path="NE.Navigation.js" />
/// <reference path="NE.UI.js" />

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

NE.EventHandlers = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////



    //////////////////////
    //
    //  Initiation
    //
    /////////////////////

    (function () {



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

        Navigation: function (e) {

            var navObj = $('#' + NE.Constants.FLOATING_HEADER_ID),
                mainContainer = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID),
                navHeight = navObj.outerHeight(),
                offsetTop = 0;

            if (e.index > 0 && navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
                navObj.removeClass(NE.Constants.OF_CANVAS_TOP_CLASS);
                mainContainer.css('top', navHeight + 'px');
                offsetTop = navHeight;
            }
            else if (e.index < 1 && !navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
                navObj.addClass(NE.Constants.OF_CANVAS_TOP_CLASS);
                mainContainer.css('top', '0px');
            }

            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
            currentChapter.animate({ 'scrollTop': 0 }, 0);

            NE.UI.ResizeScrollContainer(offsetTop, true);

        },

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

