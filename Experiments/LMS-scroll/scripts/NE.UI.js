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

    var _lastChapterIndex;

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

            jqObj.addClass('NE-scroll-padding-left-anim');
            var cssObj = {
                'overflow': 'hidden',
                'padding-left': '0px'
            };

            var totalHeight = 0;
            jqObj.find('.container').each(function () {
                totalHeight += $(this).outerHeight();
            });

            if (totalHeight > jqObj.innerHeight()) {

                jqObj.removeClass('NE-scroll-padding-left-anim');
                cssObj = {
                    'overflow': 'auto',
                    'padding-left': this.ScrollBarWidth + 'px'
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

            var prevChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + (_lastChapterIndex));
            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
            var animTime = i_animate ? 500 : 0;

            prevChapter.addClass('NE-page-room-for-next');
            setTimeout(function () {
                prevChapter.addClass('go');
            }, 0);

            $('#' + NE.Constants.SCROLL_CONTAINER_ID).animate({ 'scrollTop': currentChapter.position().top - (i_offsetTop) }, animTime, function () {
                prevChapter.removeClass('NE-page-room-for-next').removeClass('go');
                NE.UI.ApplyVerticalScrollbar(currentChapter);
            });


            _lastChapterIndex = NE.Navigation.CurrentChapterIndex;

        },

        eof: null
    };

})();

