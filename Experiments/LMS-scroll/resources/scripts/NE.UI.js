﻿/// <reference path="NE.Navigation.js" />
/// <reference path="NE.Constants.js" />
/// <reference path="../../content/structure/courseTree.js" />
/// <reference path="libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="NE.Scroll.js" />

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

    var _scrollbarWidth = null;
    var _scrollerTarget = 0;
    var _scrollHintDismissed = false;
    var _hintTImer = null;

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
        if (_scrollbarWidth !== null) return _scrollbarWidth;

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

        _scrollbarWidth = widthNoScroll - widthWithScroll;
        return _scrollbarWidth;
    }

    function _switchTopMenu() {
        var menu = $('#' + NE.Constants.FLOATING_HEADER_ID);
        var main = $('#' + NE.Constants.SCROLL_CONTAINER_ID);

        if ((NE.Navigation.CurrentPageIndex > 0 || NE.Navigation.CurrentChapterIndex > 0) || $('#isXS').is(':visible')) {
            menu.css('top', '0px');
            main.css('top', 83 + 'px');
        }
        else {
            menu.css('top', -83 + 'px');
            main.css('top', '0px');
        }

    }

    function _scrollHintAnimate(i_scrollElem, i_scrollTop) {

        clearTimeout(_hintTImer);

        if (i_scrollElem.scrollTop() != i_scrollTop || _scrollHintDismissed || (NE.Navigation.CurrentChapterIndex > 0 || NE.Navigation.CurrentPageIndex > 0)) {
            $('#NE-scroll-hint').removeClass('active').addClass('hidden');
            _scrollHintDismissed = true;
            return;
        }

        _hintTImer = setTimeout(function () {
            _scrollHintAnimate(i_scrollElem, i_scrollTop);
        }, 100);

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

        AcceptScrollEvent: false,

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Setup: function () {
            if (!_scrollHintDismissed) {
                _hintTImer = setTimeout(NE.UI.ScrollHint, 5000);
            }
            $('#' + NE.Constants.SCROLL_CONTAINER_ID).css('padding-left', _getScrollbarWidth() + 'px');
        },

        ToggleForwardNavButtons: function (onoff) {
            if (!onoff) {
                $('.NE-nav-forward').addClass('disable');
            } else {
                $('.NE-nav-forward').removeClass('disable');
                NE.UI.SetNavigationButtons();
            }
        },

        ToggleBackNavButtons: function (onoff) {
            if (!onoff) {
                $('.NE-nav-back').addClass('disable');
            } else {
                $('.NE-nav-back').removeClass('disable');
                NE.UI.SetNavigationButtons();
            }
        },

        SetNavigationButtons: function () {
            if (NE.Navigation.CurrentPageIndex == 0 && NE.Navigation.CurrentChapterIndex == 0) {
                $('.NE-nav-back').addClass('disable');
            }
            else {
                $('.NE-nav-back').removeClass('disable');
            }

            if (NE.Navigation.IsAtLast()) {
                $('.NE-nav-forward').addClass('disable');
            }
            else {
                $('.NE-nav-forward').removeClass('disable');
            }
        },

        RevealPage: function (i_skipAnimation) {

            var currentPage = NE.Navigation.CurrentPageDiv();
            var animTime = i_skipAnimation ? 0 : 300;

            if (currentPage.hasClass('hidden')) {
                currentPage.removeClass('hidden').slideUp(0).slideDown(animTime, 'swing', function () {
                    NE.UI.ScrollToPage(i_skipAnimation);
                });
            }
            else {
                NE.UI.ScrollToPage(i_skipAnimation);
            }
        },

        ScrollToPage: function (i_skipAnimation) {

            NE.UI.AcceptScrollEvent = false;

            var animTime = i_skipAnimation ? 0 : 300;
            var currentPage = NE.Navigation.CurrentPageDiv();
            var currentChapter = NE.Navigation.CurrentChapterDiv();
            var scroller = $('#' + NE.Constants.SCROLL_CONTAINER_ID);

            _switchTopMenu();

            scroller.animate({ 'scrollTop': '+=' + (currentChapter.position().top + currentPage.position().top) }, animTime);


        },

        ScrollHint: function () {
            var currentChapter = NE.Navigation.CurrentChapterDiv();
            $('#NE-scroll-hint').removeClass('hidden').addClass('active');
            _scrollHintAnimate(currentChapter, currentChapter.scrollTop());
        },

        eof: null
    };


})();

