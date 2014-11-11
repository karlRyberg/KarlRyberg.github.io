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

    var _topNavBarHeight = 0;

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

    function _updateChapterButton(jqItem, jqItemClass) {
        $('.' + jqItemClass).removeClass('disable');
        jqItem.addClass('disable');
    }

    function _switchTopMenu() {

        var navObj = $('#' + NE.Constants.FLOATING_HEADER_ID);
        var mainContainer = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID);
        var navHeight = navObj.outerHeight();

        _topNavBarHeight = 0;

        if (NE.Navigation.CurrentChapterIndex > 0 && navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
            navObj.removeClass(NE.Constants.OF_CANVAS_TOP_CLASS);
            mainContainer.css('top', navHeight + 'px');

            var topPadding = $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).position().top;

            if (topPadding < navHeight) {
                _topNavBarHeight = navHeight;
                if (NE.Navigation.CurrentChapterIndex > 1) _topNavBarHeight += navHeight;
            }
        }
        else if (NE.Navigation.CurrentChapterIndex < 1 && !navObj.hasClass(NE.Constants.OF_CANVAS_TOP_CLASS)) {
            navObj.addClass(NE.Constants.OF_CANVAS_TOP_CLASS);
            mainContainer.css('top', '0px');
        }

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
            if (NE.Navigation.CurrentChapterIndex == 0) {
                $('#NE-nav-back').addClass('disable');
            }
            else {
                $('#NE-nav-back').removeClass('disable');
            }
            if (NE.Navigation.CurrentChapterIndex == 3) {
                $('#NE-nav-forward').addClass('disable');
            }
            else {
                $('#NE-nav-forward').removeClass('disable');
            }
        },

        ApplyVerticalScrollbar: function () {
            var jqObj = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
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
            _switchTopMenu();
            NE.UI.ApplyVerticalScrollbar();
        },

        UpdateChapterMenu: function () {
            var menuIitem = $('#NE-chapter-menu-link-' + NE.Navigation.CurrentChapterIndex);
            _updateChapterButton(menuIitem, 'NE-chapter-menu-link');
            _updateChapterButton($('#NE-chapter-menu-link-xs-' + NE.Navigation.CurrentChapterIndex), 'NE-chapter-menu-link-xs');
            $('#NE-chapter-label').html(menuIitem.html() + NE.Constants.HEADER_CHAPTER_NAV_ICON)
        },

        ScrollToChapter: function (i_skipAnimation) {
            var animTime = i_skipAnimation ? 0 : 500;
            var currentChapter = $('#' + NE.Constants.CHAPTER_ID_PREFIX + NE.Navigation.CurrentChapterIndex);
            currentChapter.animate({ 'scrollTop': 0 }, 0);
            $('#' + NE.Constants.SCROLL_CONTAINER_ID).animate({ 'scrollTop': currentChapter.position().top - (_topNavBarHeight) }, animTime, function () {
                NE.UI.ApplyVerticalScrollbar();
            });
        },

        eof: null
    };

})();

