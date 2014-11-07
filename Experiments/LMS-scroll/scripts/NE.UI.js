/// <reference path="NE.Navigation.js" />
/// <reference path="NE.Constants.js" />

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

NE.UI = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    function _getScrollbarWidth() {
        var outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

        document.body.appendChild(outer);

        var widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = "scroll";

        // add innerdiv
        var inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);

        var widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    }

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

        ScrollBarWidth: _getScrollbarWidth(),
        FloatingNavInnerSize: {
            height: $('#' + NE.Constants.FLOATING_HEADER_ID).innerHeight(),
            width: $('#' + NE.Constants.FLOATING_HEADER_ID).innerWidth()
        },

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Setup: function () {
            $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).css({
                'bottom': $('#' + NE.Constants.FLOATING_FOOTER_ID).outerHeight()
            });
            NE.UI.ResizeScrollContainer();
        },

        SetNavigationButtons: function (i_chapterIndex) {
            if (i_chapterIndex == 0) {
                $('#NE-nav-back').addClass('disable');
            }
            else {
                $('#NE-nav-back').removeClass('disable');
            }
            if (i_chapterIndex == 3) {
                $('#NE-nav-forward').addClass('disable');
            }
            else {
                $('#NE-nav-forward').removeClass('disable');
            }
        },

        ApplyVerticalScrollbar: function (jqObj) {

            var cssObj = {
                'overflow': 'hidden',
                'padding-left': '0px',
                '-webkit-transition': 'padding-left 0.3s',
                'transition': 'padding-left 0.3s'
            };

            var totalHeight = 0;
            jqObj.find('.container').each(function () {
                totalHeight += $(this).outerHeight();
            });

            if (totalHeight > jqObj.innerHeight()) {
                cssObj = {
                    'overflow': 'auto',
                    'padding-left': this.ScrollBarWidth + 'px',
                    '-webkit-transition': 'none',
                    'transition': 'none'
                };

                jqObj.find('.NE-full-width').each(function () {
                    $(this).css({
                        'margin-left': (NE.UI.ScrollBarWidth * -1) + 'px',
                    });
                });
            }

            jqObj.css(cssObj);

        },

        ResizeScrollContainer: function (i_offsetTop, i_animate) {

            i_offsetTop = i_offsetTop || 0;

            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex),
                animTime = i_animate ? 500 : 0;

            NE.UI.ApplyVerticalScrollbar(currentChapter);

            $('#' + NE.Constants.SCROLL_CONTAINER_ID).animate({ 'scrollTop': currentChapter.position().top - (i_offsetTop) }, animTime);

        },

        eof: null
    };

})();

