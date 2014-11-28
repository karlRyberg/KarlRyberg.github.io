/// <reference path="NE.Navigation.js" />
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
    var _firstScroll = true;

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

    function _hideScrollNavHinter(i_obj) {
        i_obj.animate({
            'top': (-i_obj.outerHeight()) + 'px',
            'border-bottom-left-radius': '100%',
            'border-bottom-right-radius': '100%',
            'opacity': 0
        }, 200);
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

            var isLastChapter = NE.Navigation.CurrentChapterIndex == NE.CourseTree.chapters.length - 1;
            var isLastPage = NE.Navigation.CurrentPageIndex == NE.CourseTree.chapters[NE.Navigation.CurrentChapterIndex].pages.length - 1;

            if (isLastChapter && isLastPage) {
                $('.NE-nav-forward').addClass('disable');
            }
            else {
                $('.NE-nav-forward').removeClass('disable');
            }
        },

        ApplyVerticalScrollbar: function () {

            var totalHeight = 0;
            var jqObj = $('#' + NE.Constants.PAGE_ID_PREFIX + NE.Navigation.CurrentChapterIndex + '-' + NE.Navigation.CurrentPageIndex);

            jqObj.css({
                'padding-bottom': '0px',
                'padding-left' : _getScrollbarWidth() + 'px'
            });

            jqObj.children('.container, .NE-full-width').each(function () {
                totalHeight += $(this).outerHeight(true);
            });


            if (totalHeight < jqObj.innerHeight()) {
                var pad = (jqObj.innerHeight() - totalHeight) + 10;
                jqObj.css('padding-bottom', pad + 'px');
            }


        },

        ResizeScrollContainer: function () {
            $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).css({
                'bottom': $('#' + NE.Constants.FLOATING_FOOTER_ID).outerHeight()
            });
            NE.UI.ApplyVerticalScrollbar();
        },


        ScrollToPage: function (i_skipAnimation) {

            _switchTopMenu();

            var animTime = i_skipAnimation ? 0 : 500;
            var currentPage = $('#' + NE.Constants.PAGE_ID_PREFIX + NE.Navigation.CurrentChapterIndex + '-' + NE.Navigation.CurrentPageIndex);
            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
            var scroller = $('#' + NE.Constants.SCROLL_CONTAINER_ID);

            currentChapter.stop(true, true).animate({ 'scrollTop': '+=' + (currentPage.position().top - _topNavBarHeight) }, animTime);
            scroller.stop(true, true).animate({ 'scrollTop': '+=' + (currentChapter.position().top - _topNavBarHeight) }, animTime);

            setTimeout(function () {
                NE.UI.ApplyVerticalScrollbar();
                NE.UI.AttachScrollNav();
            }, animTime);

            if (_lastChapter != NE.Navigation.CurrentChapterIndex) {
                _lastChapter = NE.Navigation.CurrentChapterIndex;
            }

        },

        ScrollHint: function () {
            var currentPage = $('#' + NE.Constants.PAGE_ID_PREFIX + NE.Navigation.CurrentChapterIndex + '-' + NE.Navigation.CurrentPageIndex);
            $('#NE-scroll-hint').removeClass('hidden').addClass('active');
            _scrollHintAnimate(currentPage, currentPage.scrollTop());
        },


        AttachScrollNav: function () {

            var currentPage = $('#' + NE.Constants.PAGE_ID_PREFIX + NE.Navigation.CurrentChapterIndex + '-' + NE.Navigation.CurrentPageIndex);

            if (_lastPage) {
                _lastPage.off('scroll');
            }
            _lastPage = currentPage;
            _beenNegative = false;
            _firstScroll = true;

            currentPage.on('scroll', function () {

                var mp = $(this);
                var sh = $('#NE-scroll-nav-hint');
                var newPos;

                if (mp.scrollTop() < 0) {
                    _beenNegative = true;
                    newPos = Math.min(-sh.outerHeight() - (mp.scrollTop() * 1), 0);
                    sh.stop().css('top', newPos + 'px');

                }
                else if (mp.scrollTop() === 0 && !_beenNegative && !_firstScroll) {

                    clearTimeout(_scrollExitTImer);

                    newPos = Math.min(sh.position().top - (sh.position().top * .4), 0);
                    sh.stop().css('top', newPos + 'px');
                    $(this).scrollTop(1);

                }

                else if ((mp.scrollTop() === 1 && !_beenNegative) || (mp.scrollTop() === 0 && _beenNegative)) {
                    _scrollExitTImer = setTimeout(function () {
                        _hideScrollNavHinter(sh);
                        _negScroll = 0;
                    }, 250);
                }

                else if ((mp.scrollTop() > 1 && sh.position().top > -sh.outerHeight())) {
                    clearTimeout(_scrollExitTImer);
                    _hideScrollNavHinter(sh);
                }

                if (sh.position().top > -20) {
                    if (!_navTimer) {
                        _navTimer = setTimeout(function () {
                            if (sh.position().top > -20) {
                                NE.Navigation.Previous();
                                _hideScrollNavHinter(sh);
                            }
                            _navTimer = null;
                        }, 400);
                    }
                }

                var rad = Math.max((-sh.position().top), 10);

                sh.css({
                    'border-bottom-left-radius': rad + '%',
                    'border-bottom-right-radius': rad + '%',
                    'opacity': ((sh.outerHeight() + sh.position().top) / 100)
                });

                _firstScroll = false;

            });

            if(currentPage.scrollTop() < 1)  currentPage.scrollTop(1);

        },

        eof: null
    };


})();

