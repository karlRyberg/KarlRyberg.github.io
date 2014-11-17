﻿/// <reference path="NE.Navigation.js" />
/// <reference path="NE.Constants.js" />
/// <reference path="../../content/structure/courseTree.js" />
/// <reference path="libraries/masala-ux/dist/js/jquery.min.js" />

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

    var _topNavBarHeight = 0;
    var _lastChapter = 0;

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

    function _switchTopMenu(_callback) {
        var navObj = $('#' + NE.Constants.FLOATING_HEADER_ID);
        var mainContainer = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID);
        var navHeight = navObj.outerHeight();
        var animtime = 100;
        
        _topNavBarHeight = 0;

        if ((NE.Navigation.CurrentPageIndex > 0 || NE.Navigation.CurrentChapterIndex > 0) && navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
            navObj.removeClass(NE.Constants.OF_CANVAS_TOP_CLASS);
            mainContainer.css('top', navHeight + 'px');
            _topNavBarHeight = navHeight;
        }
        else if (NE.Navigation.CurrentPageIndex == 0 && NE.Navigation.CurrentChapterIndex == 0 && !navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
            navObj.addClass(NE.Constants.OF_CANVAS_TOP_CLASS);
            mainContainer.css('top', '0px');
        }
        console.log(_topNavBarHeight);
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

        SetNavigationButtons: function () {
            if (NE.Navigation.CurrentPageIndex == 0 && NE.Navigation.CurrentChapterIndex == 0) {
                $('#NE-nav-back').addClass('disable');
            }
            else {
                $('#NE-nav-back').removeClass('disable');
            }

            var isLastChapter = NE.Navigation.CurrentChapterIndex == NE.CourseTree.chapters.length - 1;
            var isLastPage = NE.Navigation.CurrentPageIndex == NE.CourseTree.chapters[NE.Navigation.CurrentChapterIndex].pages.length - 1;

            if (isLastChapter && isLastPage) {
                $('#NE-nav-forward').addClass('disable');
            }
            else {
                $('#NE-nav-forward').removeClass('disable');
            }
        },

        ApplyVerticalScrollbar: function () {
            var jqObj = $('#' + NE.Constants.PAGE_ID_PREFIX + NE.Navigation.CurrentChapterIndex + '-' + NE.Navigation.CurrentPageIndex);
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

        ResizeScrollContainer: function () {
            NE.UI.ApplyVerticalScrollbar();
        },


        ScrollToPage: function (i_skipAnimation) {

            _switchTopMenu();

            var animTime = i_skipAnimation ? 0 : 500;
            var currentPage = $('#' + NE.Constants.PAGE_ID_PREFIX + NE.Navigation.CurrentChapterIndex + '-' + NE.Navigation.CurrentPageIndex);
            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
            var scroller = $('#' + NE.Constants.SCROLL_CONTAINER_ID);


            currentPage.scrollTop(0);
            currentChapter.animate({ 'scrollTop': '+=' + (currentPage.position().top) }, animTime);
            scroller.animate({ 'scrollTop': '+=' + (currentChapter.position().top - _topNavBarHeight) }, animTime);

            if (_lastChapter != NE.Navigation.CurrentChapterIndex) {
                _lastChapter = NE.Navigation.CurrentChapterIndex;
            }

        },

        eof: null
    };

})();

