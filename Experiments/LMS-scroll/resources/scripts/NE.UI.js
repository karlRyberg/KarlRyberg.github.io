/// <reference path="NE.Navigation.js" />
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

    var _topNavBarHeight = 0;
    var _lastChapter = 0;
    var _lastPage = 0;
    var _scrollbarWidth = null;
    var _scrollerTarget = 0;
    var _scrollHintDismissed = false;
    var _hintTImer = null;

    // Scroll nav vars
    var _scrollExitTImer;
    var _negScroll = 0;
    var _navTimer;
    var _beenNegative = false;

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
        var navObj = $('#' + NE.Constants.FLOATING_HEADER_ID);
        var mainContainer = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID);
        var navHeight = navObj.outerHeight();
        var animtime = 300;
        var isXs = $('#isXS').is(':visible');
        _topNavBarHeight = 0;

        navObj.stop(true, true);
        mainContainer.stop(true, true);

        if ((NE.Navigation.CurrentPageIndex > 0 || NE.Navigation.CurrentChapterIndex > 0 || isXs) && navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
            var h = mainContainer.innerHeight() - navHeight;
            navObj.removeClass(NE.Constants.OF_CANVAS_TOP_CLASS);
            navObj.animate({ 'top': 0 + 'px' }, animtime);
            mainContainer.animate({ 'top': navHeight + 'px' }, animtime);
            _topNavBarHeight = navHeight;
        }
        else if (NE.Navigation.CurrentPageIndex == 0 && NE.Navigation.CurrentChapterIndex == 0 && !isXs && !navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
            navObj.addClass(NE.Constants.OF_CANVAS_TOP_CLASS);
            navObj.animate({ 'top': -navHeight + 'px' }, animtime);
            mainContainer.animate({ 'top': '0px' }, animtime);
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

            NE.UI.ResizeScrollContainer();

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

        ApplyVerticalScrollbar: function () {

            var jqObj = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
            var cssObj = {
                'overflow-y': 'hidden',
                '-webkit-overflow-scrolling': 'touch'
            };

            jqObj.find('.NE-full-width').css('margin-left', '');

            var totalHeight = 0;
            jqObj.children('.NE-page').each(function () {
                totalHeight += $(this).outerHeight();
            });

            if (totalHeight > jqObj.innerHeight()) {

                cssObj = {
                    'overflow-y': 'auto',
                    '-webkit-overflow-scrolling': 'touch'
                };


                jqObj.children('.NE-page').css('padding-left', _getScrollbarWidth() + 'px');

                if ($('#isXS').is(':visible')) {
                    jqObj.find('.NE-full-width').css('margin-left', -_getScrollbarWidth() + 'px');
                }

            }

            if (!_scrollHintDismissed) {
                _hintTImer = setTimeout(NE.UI.ScrollHint, 5000);
            }

            jqObj.css(cssObj);

        },

        ResizeScrollContainer: function () {
            $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).css({
                'bottom': $('#' + NE.Constants.FLOATING_FOOTER_ID).outerHeight()
            });
            NE.UI.ApplyVerticalScrollbar();
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

            _switchTopMenu();

            var backing = _lastChapter > NE.Navigation.CurrentChapterIndex;
            var animTime = i_skipAnimation ? 0 : 300;
            var currentPage = NE.Navigation.CurrentPageDiv();
            var currentChapter = NE.Navigation.CurrentChapterDiv();
            var scroller = $('#' + NE.Constants.SCROLL_CONTAINER_ID);

            if (!backing) {
                currentChapter.stop(true, true).animate({ 'scrollTop': (currentPage.position().top + currentChapter.scrollTop()) }, animTime);
            }


            scroller.stop(true, true).animate({ 'scrollTop': '+=' + (currentChapter.position().top - _topNavBarHeight) }, animTime, function () {
                NE.UI.ApplyVerticalScrollbar();
                NE.UI.AcceptScrollEvent = true;
            });


            if (_lastChapter != NE.Navigation.CurrentChapterIndex) {
                _lastChapter = NE.Navigation.CurrentChapterIndex;
            }

        },

        ScrollHint: function () {
            var currentPage = $('#' + NE.Constants.PAGE_ID_PREFIX + NE.Navigation.CurrentChapterIndex + '-' + NE.Navigation.CurrentPageIndex);
            $('#NE-scroll-hint').removeClass('hidden').addClass('active');
            _scrollHintAnimate(currentPage, currentPage.scrollTop());
        },

        eof: null
    };


})();

