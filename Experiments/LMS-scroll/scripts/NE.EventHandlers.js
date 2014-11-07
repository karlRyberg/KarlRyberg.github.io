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

            if (e.index == 0) {
                $('#NE-nav-back').addClass('disable');
            }
            else {
                $('#NE-nav-back').removeClass('disable');
            }
            if (e.index == 3) {
                $('#NE-nav-forward').addClass('disable');
            }
            else {
                $('#NE-nav-forward').removeClass('disable');
            }


            var navObj = $('#' + NE.Constants.FLOATING_HEADER_ID),
                mainContainer = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID),
                navHeight = navObj.outerHeight(),
                offsetTop = 0;

            if (e.index > 0 && navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
                navObj.removeClass(NE.Constants.OF_CANVAS_TOP_CLASS);
                $('#' + NE.Constants.CLOSE_BUTTON_ID).removeClass(NE.Constants.OF_CANVAS_TOP_CLASS);
                mainContainer.css('top', navHeight + 'px');

                var topPadding = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).position().top;

                if (topPadding < navHeight) {
                    offsetTop = navHeight;
                    if (e.index > 1) offsetTop += navHeight;
                }
                console.log(topPadding + ' < ' + navHeight + '  ' + offsetTop);
    
            }
            else if (e.index < 1 && !navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
                navObj.addClass(NE.Constants.OF_CANVAS_TOP_CLASS);
                $('#' + NE.Constants.CLOSE_BUTTON_ID).addClass(NE.Constants.OF_CANVAS_TOP_CLASS);
                mainContainer.css('top', '0px');
            }

            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
            currentChapter.animate({ 'scrollTop': 0 }, 0);

            NE.UI.ResizeScrollContainer(offsetTop, true);

            var chapterMenuItem = $('#NE-chapter-menu-link-' + e.index);
            $('.NE-chapter-menu-link').removeClass('disable');
            chapterMenuItem.addClass('disable');

            $('#NE-chapter-label').html(chapterMenuItem.html() + NE.Constants.HEADER_CHAPTER_NAV_ICON)


            var smallChapterMenuItem = $('#NE-chapter-menu-link-xs-' + e.index);
            $('.NE-chapter-menu-link-xs').removeClass('disable');
            smallChapterMenuItem.addClass('disable');
        },


        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

