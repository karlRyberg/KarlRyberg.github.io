/// <reference path="NE.Navigation.js" />

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

        ApplyVerticalScrollbar: function (jqObj) {

            var cssObj = {
                'overflow': 'hidden',
                'padding-left': '0px',
                'transition-duration': '.2s'
            };

            if (jqObj.find('.container').first().outerHeight() > jqObj.innerHeight()) {
                cssObj = {
                    'overflow': 'auto',
                    'padding-left': this.ScrollBarWidth + 'px',
                    'transition-duration': '0s'
                };
            }

            jqObj.css(cssObj);

        },

        ResizeScrollContainer: function (i_offsetTop, i_animate) {
            i_offsetTop = i_offsetTop || 0;
           
            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex),
                animTime = i_animate ? 500 : 0;

        

            $('#' + NE.Constants.SCROLL_CONTAINER_ID).animate({ 'scrollTop': currentChapter.position().top - (i_offsetTop * NE.Navigation.CurrentChapterIndex) }, animTime, function () {
                    NE.UI.ApplyVerticalScrollbar(currentChapter);
                });


        },

        eof: null
    };

})();

