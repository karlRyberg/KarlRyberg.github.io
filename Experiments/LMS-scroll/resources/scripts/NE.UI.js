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

    var _topMenuOffset = 0;
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
            $('#' + NE.Constants.FLOATING_HEADER_ID).css('right', _getScrollbarWidth() + 'px');
            $('#NE-top-backdrop').css('right', _getScrollbarWidth() + 'px');

            if ($('#isXS').is(':visible')) {
                $('#'+NE.Constants.CHAPTER_ID_PREFIX + '0').css('padding-top','83px')
            }
        },

        PreHide: function () {
            var isHidden = false;
            $('.NE-page').each(function () {
                var page = $(this);
                if (page.hasClass('NE-nav-hidden')) {
                    isHidden = true;
                }
                else if (isHidden) {
                    page.addClass('NE-nav-hidden')
                }
            });
            $('.NE-chapter').each(function () {
                var chapter = $(this);
                var pages = chapter.find('.NE-page');
                var hiddenPages = chapter.find('.NE-nav-hidden');

                if (pages.length && pages.length == hiddenPages.length) {
                    chapter.addClass('NE-nav-hidden');
                }
            });

        },

        HideVIsitedItems: function (i_chapter, i_page) {

            if (i_page === null || i_page === undefined) {
                $('#' + NE.Constants.CHAPTER_ID_PREFIX + i_chapter).find('.NE-hidden-visited').addClass('hidden');
            }
            else {
                $('#' + NE.Constants.PAGE_ID_PREFIX + i_chapter + '-' + i_page).find('.NE-hidden-visited').addClass('hidden');
            }
        },

        Unlock: function (i_chapter, i_page) {
            i_page = i_page || 0;

            for (var i = i_chapter; i < NE.CourseTree.chapters.length; i++) {
                var oneVisible = false;
                var chapter = NE.CourseTree.chapters[i];

                for (var j = i_page; j < chapter.pages.length; j++) {

                    var page = chapter.pages[j];
       
                    if (page.stopprogress) return;

                    $('#NE-page-' + i + '-' + j).removeClass('NE-nav-hidden');
                    oneVisible = true;
                }
                if (oneVisible) $('#NE-chapter-' + i).removeClass('NE-nav-hidden');

            }

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

        SwitchTopMenu: function () {
            var menu = $('#' + NE.Constants.FLOATING_HEADER_ID);
            var main = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID);

            if ((NE.Navigation.CurrentPageIndex > 0 || NE.Navigation.CurrentChapterIndex > 0) || $('#isXS').is(':visible')) {
                _topMenuOffset = 83;
                menu.removeClass('NE-offcanvas');
            }
            else {
                _topMenuOffset = 0;
                menu.addClass('NE-offcanvas');
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
            NE.UI.AcceptScrollEvent = false;
            var currentPage = NE.Navigation.CurrentPageDiv();
            var animTime = i_skipAnimation ? 0 : 300;

            if (currentPage.hasClass('hidden') || currentPage.hasClass('NE-nav-hidden')) {
                currentPage.parent('.NE-chapter').removeClass('NE-nav-hidden hidden');
                currentPage.removeClass('NE-nav-hidden hidden').slideUp(0).slideDown(animTime, 'swing', function () {
                    NE.UI.Unlock(NE.Navigation.CurrentChapterIndex, NE.Navigation.CurrentPageIndex);
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

            scroller.animate({ 'scrollTop': '+=' + (currentChapter.position().top + currentPage.position().top - _topMenuOffset) }, animTime, function () {
                NE.UI.AcceptScrollEvent = true;
            });


        },

        ScrollHint: function () {
            var scroller = $('#' + NE.Constants.SCROLL_CONTAINER_ID);
            $('#NE-scroll-hint').removeClass('hidden').addClass('active');
            _scrollHintAnimate(scroller, scroller.scrollTop());
        },

        eof: null
    };


})();

